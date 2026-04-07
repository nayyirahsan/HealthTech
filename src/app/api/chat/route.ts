import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey:  process.env.XAI_API_KEY ?? "",
  baseURL: "https://api.x.ai/v1",
});

const SYSTEM_PROMPT = `You are a UT Austin premed advisor with deep expertise in medical school admissions. You have access to UT HPO (Health Professions Office) admissions data from 2021–2023, AAMC acceptance grids, TMDSAS/AMCAS/AACOMAS acceptance statistics, and school-specific outcome data for UT Austin students.

Be direct and data-driven. When discussing acceptance chances, cite specific numbers (e.g. "UT students with a 3.75 GPA and 512 MCAT had a 22% acceptance rate at Texas A&M COM"). When recommending extracurriculars, reference the UT HPO median benchmarks. Keep responses concise — 2–4 paragraphs max. Use markdown formatting for lists and emphasis.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ error: "XAI_API_KEY not configured" }, { status: 500 });
    }

    const completion = await client.chat.completions.create({
      model:       "grok-3-mini-fast",
      messages:    [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens:  1024,
      temperature: 0.7,
    });

    const reply   = completion.choices[0]?.message?.content ?? "";
    const sources = extractSources(reply);

    return NextResponse.json({ reply, sources });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Heuristic source tagger ───────────────────────────────────────────────────
// Scans the reply for mentions of known data sources so the context panel
// can surface relevant chips without a full RAG pipeline.

function extractSources(text: string): { type: string; label: string }[] {
  const sources: { type: string; label: string }[] = [];
  const lower = text.toLowerCase();

  if (/hpo|health professions office/.test(lower))
    sources.push({ type: "hpo",       label: "UT HPO Reports 2021–2023" });
  if (/aamc|acceptance grid/.test(lower))
    sources.push({ type: "aamc",      label: "AAMC Acceptance Grid" });
  if (/tmdsas/.test(lower))
    sources.push({ type: "tmdsas",    label: "TMDSAS Cycle Data" });
  if (/amcas/.test(lower))
    sources.push({ type: "amcas",     label: "AMCAS Cycle Data" });
  if (/aacomas|osteopath|do school/.test(lower))
    sources.push({ type: "aacomas",   label: "AACOMAS / DO Data" });
  if (/utsw|ut southwestern/.test(lower))
    sources.push({ type: "school",    label: "UT Southwestern" });
  if (/baylor/.test(lower))
    sources.push({ type: "school",    label: "Baylor COM" });
  if (/texas a&m|tamu/.test(lower))
    sources.push({ type: "school",    label: "Texas A&M COM" });
  if (/ut health|mcgovern|uth/.test(lower))
    sources.push({ type: "school",    label: "UT Health Houston" });
  if (/tcom|osteopathic medicine of texas/.test(lower))
    sources.push({ type: "school",    label: "TCOM (UNT)" });
  if (/clinical hour|shadowing|research hour|volunteer/.test(lower))
    sources.push({ type: "benchmark", label: "UT HPO EC Benchmarks" });
  if (/mcat|gpa/.test(lower))
    sources.push({ type: "stats",     label: "Applicant Stats Database" });

  // Dedupe by label
  return sources.filter((s, i, arr) => arr.findIndex((x) => x.label === s.label) === i);
}
