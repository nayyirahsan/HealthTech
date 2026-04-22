"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useTheme } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";

// ── Default data ──────────────────────────────────────────────────────────────

const USER_DEFAULT = {
  gpa: 0,
  mcat: 0,
  clinicalHours: 0,
  researchHours: 0,
  volunteerHours: 0,
  shadowingHours: 0,
};

const UT_DEFAULT = {
  gpa: 3.82,
  mcat: 513,
  clinicalHours: 1200,
  researchHours: 600,
  volunteerHours: 250,
  shadowingHours: 120,
};

// Normalise each axis 0–100 so the radar is comparable across different units.
// Each axis max is set to a generous ceiling above UT median.
const AXIS_MAX = {
  gpa:            4.0,
  mcat:           528,
  clinicalHours:  2000,
  researchHours:  1000,
  volunteerHours: 400,
  shadowingHours: 200,
};

function norm(value: number, key: keyof typeof AXIS_MAX) {
  return Math.round((Math.min(value, AXIS_MAX[key]) / AXIS_MAX[key]) * 100);
}

// RADAR_DATA is now computed inside the component using live utMedian state

// ── Stat card config ─────────────────────────────────────────────────────────

const STATS: {
  key:      keyof typeof USER_DEFAULT;
  label:    string;
  unit:     string;
  format:   (v: number) => string;
  cta:      string;
}[] = [
  {
    key:    "gpa",
    label:  "GPA",
    unit:   "",
    format: (v) => v.toFixed(2),
    cta:    "Improve GPA",
  },
  {
    key:    "mcat",
    label:  "MCAT",
    unit:   "",
    format: (v) => v.toString(),
    cta:    "Improve MCAT",
  },
  {
    key:    "clinicalHours",
    label:  "Clinical Hours",
    unit:   " hrs",
    format: (v) => v.toLocaleString(),
    cta:    "Find Clinical Opportunities",
  },
  {
    key:    "researchHours",
    label:  "Research Hours",
    unit:   " hrs",
    format: (v) => v.toLocaleString(),
    cta:    "Find Research Opportunities",
  },
  {
    key:    "volunteerHours",
    label:  "Volunteer Hours",
    unit:   " hrs",
    format: (v) => v.toLocaleString(),
    cta:    "Find Volunteer Opportunities",
  },
  {
    key:    "shadowingHours",
    label:  "Shadowing Hours",
    unit:   " hrs",
    format: (v) => v.toLocaleString(),
    cta:    "Find Shadowing Opportunities",
  },
];

// ── Custom radar dot ─────────────────────────────────────────────────────────

function CustomRadarDot(props: {
  cx?: number; cy?: number; fill?: string;
}) {
  const { cx = 0, cy = 0, fill } = props;
  return <circle cx={cx} cy={cy} r={3} fill={fill} stroke="none" />;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  userValue,
  medianValue,
  format,
  unit,
  cta,
}: {
  label:       string;
  userValue:   number;
  medianValue: number;
  format:      (v: number) => string;
  unit:        string;
  cta:         string;
}) {
  const delta     = userValue - medianValue;
  const isAbove   = delta >= 0;
  const deltaAbs  = Math.abs(delta);
  const deltaStr  = format(deltaAbs) + unit;

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
        {label}
      </span>

      {/* Values row */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[2rem] font-bold text-white leading-none">
            {format(userValue)}{unit}
          </p>
          <p className="text-[11px] text-white/30 mt-1.5">
            UT Median:{" "}
            <span className="text-white/50 font-mono">
              {format(medianValue)}{unit}
            </span>
          </p>
        </div>

        {/* Delta badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 ${
            isAbove
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {isAbove ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isAbove ? "+" : "−"}{deltaStr}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1 bg-white/10 rounded-full">
        <div
          className={`absolute left-0 top-0 h-full rounded-full ${
            isAbove ? "bg-[#BF5700]" : "bg-red-500/60"
          }`}
          style={{
            width: `${Math.min(
              (userValue / (medianValue * 1.5)) * 100,
              100
            )}%`,
          }}
        />
        {/* Median tick */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-white/40"
          style={{ left: `${Math.min((medianValue / (medianValue * 1.5)) * 100, 100)}%` }}
        />
      </div>

      {/* CTA */}
      <Link
        href="/opportunities"
        className="mt-auto flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#BF5700]/10 border border-[#BF5700]/20 text-xs font-medium text-[#BF5700] hover:bg-[#BF5700]/20 transition-colors group"
      >
        {cta}
        <ArrowRight size={12} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

// ── Custom legend ─────────────────────────────────────────────────────────────

function RadarLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-0.5 bg-[#BF5700] rounded" />
        <span className="text-[11px] text-white/40">You</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-0.5 bg-white/40 rounded" />
        <span className="text-[11px] text-white/40">UT Admitted Median</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UTBenchmarksPage() {
  const [user, setUser] = useState(USER_DEFAULT);
  const [utMedian, setUtMedian] = useState(UT_DEFAULT);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const gridStroke   = isLight ? "rgba(0,0,0,0.10)"  : "rgba(255,255,255,0.08)";
  const medianStroke = isLight ? "rgba(0,0,0,0.35)"  : "rgba(255,255,255,0.35)";
  const medianFill   = isLight ? "rgba(0,0,0,0.06)"  : "rgba(255,255,255,0.04)";
  const tickFill     = isLight ? "rgba(0,0,0,0.55)"  : "rgba(255,255,255,0.40)";
  const dotFill      = isLight ? "rgba(0,0,0,0.40)"  : "rgba(255,255,255,0.40)";

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const benchPromise = supabase.from("ut_benchmarks").select("metric, median_value");

      if (!authUser) {
        const benchRes = await benchPromise;
        if (!benchRes.error && benchRes.data && benchRes.data.length > 0) {
          const lookup = Object.fromEntries(benchRes.data.map((r) => [r.metric, Number(r.median_value)]));
          setUtMedian({
            gpa: lookup.gpa ?? UT_DEFAULT.gpa,
            mcat: lookup.mcat ?? UT_DEFAULT.mcat,
            clinicalHours: lookup.clinical_hours ?? UT_DEFAULT.clinicalHours,
            researchHours: lookup.research_hours ?? UT_DEFAULT.researchHours,
            volunteerHours: lookup.volunteer_hours ?? UT_DEFAULT.volunteerHours,
            shadowingHours: lookup.shadowing_hours ?? UT_DEFAULT.shadowingHours,
          });
        }
        setLoading(false);
        return;
      }

      const [userRes, benchRes] = await Promise.all([
        supabase
          .from("users")
          .select("gpa, mcat_score, clinical_hours, research_hours, volunteer_hours, shadowing_hours")
          .eq("id", authUser.id)
          .maybeSingle(),
        benchPromise,
      ]);

      if (!userRes.error && userRes.data) {
        const u = userRes.data;
        setUser({
          gpa: u.gpa ?? 0,
          mcat: u.mcat_score ?? 0,
          clinicalHours: u.clinical_hours ?? 0,
          researchHours: u.research_hours ?? 0,
          volunteerHours: u.volunteer_hours ?? 0,
          shadowingHours: u.shadowing_hours ?? 0,
        });
      }

      if (!benchRes.error && benchRes.data && benchRes.data.length > 0) {
        const lookup = Object.fromEntries(benchRes.data.map((r) => [r.metric, Number(r.median_value)]));
        setUtMedian({
          gpa: lookup.gpa ?? UT_DEFAULT.gpa,
          mcat: lookup.mcat ?? UT_DEFAULT.mcat,
          clinicalHours: lookup.clinical_hours ?? UT_DEFAULT.clinicalHours,
          researchHours: lookup.research_hours ?? UT_DEFAULT.researchHours,
          volunteerHours: lookup.volunteer_hours ?? UT_DEFAULT.volunteerHours,
          shadowingHours: lookup.shadowing_hours ?? UT_DEFAULT.shadowingHours,
        });
      }

      setLoading(false);
    })();
  }, []);

  const RADAR_DATA = [
    { axis: "GPA",       user: norm(user.gpa,            "gpa"),            median: norm(utMedian.gpa,            "gpa")            },
    { axis: "MCAT",      user: norm(user.mcat,           "mcat"),           median: norm(utMedian.mcat,           "mcat")           },
    { axis: "Clinical",  user: norm(user.clinicalHours,  "clinicalHours"),  median: norm(utMedian.clinicalHours,  "clinicalHours")  },
    { axis: "Research",  user: norm(user.researchHours,  "researchHours"),  median: norm(utMedian.researchHours,  "researchHours")  },
    { axis: "Volunteer", user: norm(user.volunteerHours, "volunteerHours"), median: norm(utMedian.volunteerHours, "volunteerHours") },
    { axis: "Shadowing", user: norm(user.shadowingHours, "shadowingHours"), median: norm(utMedian.shadowingHours, "shadowingHours") },
  ];

  const aheadCount  = STATS.filter(({ key }) => user[key] >= utMedian[key]).length;
  const behindCount = STATS.length - aheadCount;

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">UT Benchmarks</h1>
          <p className="text-sm text-white/35 mt-0.5">
            {loading ? "Loading benchmark data..." : "How you compare to UT Austin admitted students · HPO data 2021–2023"}
          </p>
        </div>

        {/* Quick summary pill */}
        <div className="flex gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
            <TrendingUp size={11} />
            {aheadCount} ahead
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
            <TrendingDown size={11} />
            {behindCount} behind
          </span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
            Profile Comparison
          </span>
          <span className="text-[11px] text-white/20 font-mono">normalised 0–100</span>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid
              stroke={gridStroke}
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={{
                fill: tickFill,
                fontSize: 11,
                fontFamily: "var(--font-geist-sans)",
                fontWeight: 500,
              }}
              tickLine={false}
            />
            {/* UT Median — ghost outline first so user polygon renders on top */}
            <Radar
              name="UT Admitted Median"
              dataKey="median"
              stroke={medianStroke}
              strokeWidth={1.5}
              fill={medianFill}
              dot={<CustomRadarDot fill={dotFill} />}
            />
            {/* User */}
            <Radar
              name="You"
              dataKey="user"
              stroke="#BF5700"
              strokeWidth={2}
              fill="rgba(191,87,0,0.15)"
              dot={<CustomRadarDot fill="#BF5700" />}
            />
            <Legend content={<RadarLegend />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map(({ key, label, unit, format, cta }) => (
          <StatCard
            key={key}
            label={label}
            userValue={user[key]}
            medianValue={utMedian[key]}
            format={format}
            unit={unit}
            cta={cta}
          />
        ))}
      </div>

      <p className="text-[11px] text-white/20 text-center font-mono pb-2">
        Source: UT Austin HPO Reports 2021–2023 · Medians reflect admitted applicants across TMDSAS, AMCAS, and AACOMAS
      </p>
    </div>
  );
}
