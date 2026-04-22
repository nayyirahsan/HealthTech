import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function gpaRangeBucket(gpa: number): string {
  if (gpa >= 3.8) return "3.80-4.00";
  if (gpa >= 3.6) return "3.60-3.79";
  if (gpa >= 3.4) return "3.40-3.59";
  if (gpa >= 3.2) return "3.20-3.39";
  if (gpa >= 3.0) return "3.00-3.19";
  return "2.80-2.99";
}

function mcatRangeBucket(mcat: number): string {
  if (mcat >= 517) return "517-528";
  if (mcat >= 514) return "514-516";
  if (mcat >= 510) return "510-513";
  if (mcat >= 506) return "506-509";
  if (mcat >= 502) return "502-505";
  return "498-501";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gpa = Number(body?.gpa);
    const mcat = Number(body?.mcat);

    if (!Number.isFinite(gpa) || !Number.isFinite(mcat)) {
      return NextResponse.json({ error: "gpa and mcat are required numbers" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("acceptance_grid")
      .select("acceptance_rate, source, year, gpa_range, mcat_range")
      .eq("source", "AAMC")
      .eq("gpa_range", gpaRangeBucket(gpa))
      .eq("mcat_range", mcatRangeBucket(mcat))
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "No acceptance grid match found for this GPA/MCAT range." }, { status: 404 });
    }

    return NextResponse.json({
      acceptanceRate: Math.round(Number(data.acceptance_rate)),
      source: data.source,
      year: data.year,
      gpaRange: data.gpa_range,
      mcatRange: data.mcat_range,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
