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
    const { messages, sessionId: incomingSessionId } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      sessionId?: string | null;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const latestUserMessage = messages[messages.length - 1];

    let sessionId = incomingSessionId ?? null;
    if (!sessionId) {
      const title = latestUserMessage.content.trim().slice(0, 60) || "New chat";
      const { data: newSession, error: sessionErr } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (sessionErr || !newSession) {
        console.error("[/api/chat] failed to create session", sessionErr?.message);
        return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 });
      }
      sessionId = newSession.id;
    }

    const { reply, citations } = await runAdvisor({
      supabase,
      user,
      messages,
    });

    const { error: historyError } = await supabase.from("chat_history").insert([
      {
        user_id: user.id,
        session_id: sessionId,
        role: "user",
        content: latestUserMessage.content,
        context_used: null,
      },
      {
        user_id: user.id,
        session_id: sessionId,
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

    const { error: bumpError } = await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (bumpError) {
      console.error("[/api/chat] failed to bump session updated_at", bumpError.message);
    }

    return NextResponse.json({ reply, sources: citations, sessionId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
