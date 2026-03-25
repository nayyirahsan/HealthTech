import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: Integrate Anthropic Claude API with user profile context + RAG
  const body = await req.json();
  return NextResponse.json({
    message: "Chat endpoint placeholder",
    received: body,
  });
}
