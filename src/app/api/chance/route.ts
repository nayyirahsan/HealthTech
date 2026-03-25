import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: Implement chance calculation using AAMC acceptance grid data
  const body = await req.json();
  return NextResponse.json({
    message: "Chance calculator endpoint placeholder",
    received: body,
  });
}
