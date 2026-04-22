import { NextRequest, NextResponse } from "next/server";
import { runAdvisor } from "@/lib/ai/advisor";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const { reply, citations } = await runAdvisor({
      supabase,
      user,
      messages,
    });

    const latestUserMessage = messages[messages.length - 1];
    const { error: historyError } = await supabase.from("chat_history").insert([
      {
        user_id: user.id,
        role: "user",
        content: latestUserMessage.content,
        context_used: null,
      },
      {
        user_id: user.id,
        role: "assistant",
        content: reply,
        context_used: {
          citations,
          sourceCount: citations.length,
        },
      },
    ]);

    if (historyError) {
      console.error("[/api/chat] failed to persist chat history", historyError.message);
    }

    return NextResponse.json({ reply, sources: citations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
