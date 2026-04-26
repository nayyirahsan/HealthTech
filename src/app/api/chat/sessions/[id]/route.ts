import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session, error: sessionErr } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("id", params.id)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages, error: msgErr } = await supabase
    .from("chat_history")
    .select("id, role, content, context_used, created_at")
    .eq("session_id", params.id)
    .order("created_at", { ascending: true });

  if (msgErr) {
    console.error("[/api/chat/sessions/[id]] messages failed", msgErr.message);
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  return NextResponse.json({ session, messages: messages ?? [] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("[/api/chat/sessions/[id]] delete failed", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
