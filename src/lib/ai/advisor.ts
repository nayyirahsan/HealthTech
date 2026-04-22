import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdvisorModel } from "@/lib/ai/provider";
import { buildAdvisorSystemPrompt } from "@/lib/ai/prompts";
import { buildUserSummary, createAdvisorTools, loadCurrentUserProfile } from "@/lib/ai/tools";
import type { AdvisorCitation, AdvisorResponse } from "@/lib/ai/types";

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

interface RunAdvisorParams {
  supabase: SupabaseClient;
  user: User;
  messages: ChatMessageInput[];
}

const MAX_TOOL_ROUNDS = 6;

type ConversationMessage = AIMessage | HumanMessage | SystemMessage | ToolMessage;
type InvokableTool = {
  name: string;
  invoke: (input: unknown) => Promise<unknown>;
};

function uniqueCitations(citations: AdvisorCitation[]) {
  const seen = new Set<string>();

  return citations.filter((citation) => {
    const key = `${citation.type}:${citation.label}:${citation.detail}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function contentToText(content: AIMessage["content"]) {
  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if ("text" in part && typeof part.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("")
    .trim();
}

export async function runAdvisor({
  supabase,
  user,
  messages,
}: RunAdvisorParams): Promise<AdvisorResponse> {
  const userMessages = messages.filter((message) => message.role === "user" || message.role === "assistant");
  const lastMessage = userMessages.at(-1);

  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("The last message must be from the user.");
  }

  const profile = await loadCurrentUserProfile(supabase, user.id);
  const citations: AdvisorCitation[] = [];
  const tools = createAdvisorTools({
    supabase,
    user,
    onCitation: (citation) => citations.push(citation),
  });
  const toolMap = new Map<string, InvokableTool>();
  for (const toolInstance of tools as unknown as InvokableTool[]) {
    toolMap.set(toolInstance.name, toolInstance);
  }

  const model = createAdvisorModel().bindTools(tools);
  const systemPrompt = buildAdvisorSystemPrompt({
    userSummary: buildUserSummary(profile),
  });

  const conversation: ConversationMessage[] = [
    new SystemMessage(systemPrompt),
    ...userMessages.slice(0, -1).map((message) =>
      message.role === "user"
        ? new HumanMessage(message.content)
        : new AIMessage(message.content),
    ),
    new HumanMessage(lastMessage.content),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await model.invoke(conversation);
    conversation.push(response);

    if (!response.tool_calls?.length) {
      const reply = contentToText(response.content);

      if (!reply) {
        throw new Error("The advisor returned an empty response.");
      }

      return {
        reply,
        citations: uniqueCitations(citations),
      };
    }

    for (const toolCall of response.tool_calls) {
      const selectedTool = toolMap.get(toolCall.name);

      if (!selectedTool) {
        throw new Error(`Unknown tool call: ${toolCall.name}`);
      }

      // Some providers/models emit `args: null` for tools with an empty object schema.
      // LangChain/Zod expects an object, so normalize null/undefined to `{}`.
      const toolArgs = toolCall.args == null ? {} : toolCall.args;
      const toolOutput = await selectedTool.invoke(toolArgs);
      const serializedOutput =
        typeof toolOutput === "string" ? toolOutput : JSON.stringify(toolOutput);

      conversation.push(
        new ToolMessage({
          content: serializedOutput,
          tool_call_id: toolCall.id ?? toolCall.name,
        }),
      );
    }
  }

  throw new Error("The advisor exceeded the maximum number of tool rounds.");
}
