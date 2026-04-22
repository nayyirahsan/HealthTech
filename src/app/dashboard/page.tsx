"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  AlertCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useTheme } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";

// ── Constants ─────────────────────────────────────────────────────────────────

const USER_DEFAULT = {
  name: "Student",
  gpa: 0,
  mcat: 0,
  clinicalHours: 0,
  researchHours: 0,
};

// Published UT Austin HPO medians for Dell Medical School (2021–2023 reports)
const UT_MEDIAN = {
  gpa: 3.82,
  mcat: 513,
  clinicalHours: 1200,
  researchHours: 600,
};

// TMDSAS cycle open date — update each year
const TMDSAS_OPEN = new Date("2026-05-01");

// ── Types ─────────────────────────────────────────────────────────────────────

type Tier = "reach" | "target" | "safety";

interface SchoolRow {
  id:             number;
  name:           string;
  abbr:           string;
  medianGPA:      number;
  medianMCAT:     number;
  acceptanceRate: number;
  pct:            number;
  tier:           Tier;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Omit<SchoolRow, "pct" | "tier"> {
  return {
    id:             row.id,
    name:           row.name,
    abbr:           row.name.split(" ").map((w: string) => w[0]).join("").slice(0, 5).toUpperCase(),
    medianGPA:      row.median_gpa      ?? 0,
    medianMCAT:     row.median_mcat     ?? 0,
    acceptanceRate: row.acceptance_rate ?? 0,
  };
}

// Same sigmoid model used by the Chance calculator
function calcProbability(gpa: number, mcat: number, school: Omit<SchoolRow, "pct" | "tier">): number {
  const gpaZ  = (gpa  - school.medianGPA)  / 0.15;
  const mcatZ = (mcat - school.medianMCAT) / 4.5;
  const z     = (gpaZ + mcatZ) / 2;
  const base  = school.acceptanceRate / 100;
  const sig   = 1 / (1 + Math.exp(-2.2 * z));
  const raw   = base + (sig - 0.5) * 0.6;
  return Math.round(Math.max(1, Math.min(97, raw * 100)));
}

function tierFromProb(p: number): Tier {
  if (p >= 40) return "safety";
  if (p >= 18) return "target";
  return "reach";
}

// Map GPA to the acceptance_grid gpa_range bucket
function gpaRangeBucket(gpa: number): string {
  if (gpa >= 3.80) return "3.80-4.00";
  if (gpa >= 3.60) return "3.60-3.79";
  if (gpa >= 3.40) return "3.40-3.59";
  if (gpa >= 3.20) return "3.20-3.39";
  if (gpa >= 3.00) return "3.00-3.19";
  return "2.80-2.99";
}

// Map MCAT to the acceptance_grid mcat_range bucket
function mcatRangeBucket(mcat: number): string {
  if (mcat >= 517) return "517-528";
  if (mcat >= 514) return "514-516";
  return "510-513";
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

// ── Fallback school list (used while loading or if DB is empty) ───────────────

const SCHOOLS_FALLBACK: SchoolRow[] = [];

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  displayValue,
  userPct,
  medianPct,
  displayMedian,
  delta,
}: {
  label: string;
  displayValue: string;
  userPct: number;
  medianPct: number;
  displayMedian: string;
  delta: number;
}) {
  const isClose = Math.abs(delta) < 0.02;
  const isAbove = delta > 0;

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors">
      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
        {label}
      </span>

      <div className="flex items-end justify-between gap-2">
        <span className="font-mono text-[2rem] font-bold text-white leading-none">
          {displayValue}
        </span>
        {isClose ? (
          <span className="flex items-center gap-1 text-[11px] text-white/35 pb-0.5">
            <Minus size={11} /> At median
          </span>
        ) : isAbove ? (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 pb-0.5">
            <TrendingUp size={11} /> Above
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-red-400 pb-0.5">
            <TrendingDown size={11} /> Below
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-1 bg-white/10 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-[#BF5700] rounded-full"
          style={{ width: `${userPct}%` }}
        />
        {/* Median tick mark */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-white/40"
          style={{ left: `${medianPct}%` }}
        />
      </div>

      <span className="text-[11px] text-white/25">
        UT Median:{" "}
        <span className="text-white/45 font-mono">{displayMedian}</span>
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { theme } = useTheme();
  const emptyFill = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)";

  const [user,          setUser]          = useState(USER_DEFAULT);
  const [schools,       setSchools]       = useState<SchoolRow[]>(SCHOOLS_FALLBACK);
  const [acceptancePct, setAcceptancePct] = useState(0);

  const daysToOpen = daysUntil(TMDSAS_OPEN);

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return;
      }

      const { data: row, error } = await supabase
        .from("users")
        .select("full_name, gpa, mcat_score, clinical_hours, research_hours")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!error && row) {
        setUser({
          name: row.full_name ?? USER_DEFAULT.name,
          gpa: row.gpa ?? 0,
          mcat: row.mcat_score ?? 0,
          clinicalHours: row.clinical_hours ?? 0,
          researchHours: row.research_hours ?? 0,
        });
      }

      const gpa = row?.gpa ?? 0;
      const mcat = row?.mcat_score ?? 0;

      const { data: schoolRows, error: schoolError } = await supabase
        .from("schools")
        .select("id, name, median_gpa, median_mcat, acceptance_rate")
        .eq("state", "TX")
        .eq("type", "MD")
        .not("median_gpa", "is", null)
        .not("median_mcat", "is", null)
        .not("acceptance_rate", "is", null)
        .order("acceptance_rate", { ascending: true })
        .limit(5);

      if (!schoolError && schoolRows && schoolRows.length > 0) {
        const enriched = schoolRows
          .map(mapRow)
          .map((s) => {
            const pct = calcProbability(gpa, mcat, s);
            return { ...s, pct, tier: tierFromProb(pct) };
          })
          .sort((a, b) => b.pct - a.pct);
        setSchools(enriched);
      }

      const { data: gridRow, error: gridError } = await supabase
        .from("acceptance_grid")
        .select("acceptance_rate")
        .eq("gpa_range", gpaRangeBucket(gpa))
        .eq("mcat_range", mcatRangeBucket(mcat))
        .limit(1)
        .maybeSingle();

      if (!gridError && gridRow) {
        setAcceptancePct(Math.round(Number(gridRow.acceptance_rate)));
      }
    })();
  }, []);

  const donutData = [
    { value: acceptancePct },
    { value: 100 - acceptancePct },
  ];

  const clinicalGap = UT_MEDIAN.clinicalHours - user.clinicalHours;

  const stats = [
    {
      label: "GPA",
      displayValue: user.gpa.toFixed(2),
      userPct: (user.gpa / 4.0) * 100,
      medianPct: (UT_MEDIAN.gpa / 4.0) * 100,
      displayMedian: UT_MEDIAN.gpa.toFixed(2),
      delta: user.gpa - UT_MEDIAN.gpa,
    },
    {
      label: "MCAT",
      displayValue: user.mcat.toString(),
      userPct: (user.mcat / 528) * 100,
      medianPct: (UT_MEDIAN.mcat / 528) * 100,
      displayMedian: UT_MEDIAN.mcat.toString(),
      delta: user.mcat - UT_MEDIAN.mcat,
    },
    {
      label: "Clinical Hours",
      displayValue: user.clinicalHours.toLocaleString(),
      userPct: (user.clinicalHours / 2000) * 100,
      medianPct: (UT_MEDIAN.clinicalHours / 2000) * 100,
      displayMedian: UT_MEDIAN.clinicalHours.toLocaleString() + " hrs",
      delta: user.clinicalHours - UT_MEDIAN.clinicalHours,
    },
    {
      label: "Research Hours",
      displayValue: user.researchHours.toLocaleString(),
      userPct: (user.researchHours / 1000) * 100,
      medianPct: (UT_MEDIAN.researchHours / 1000) * 100,
      displayMedian: UT_MEDIAN.researchHours.toLocaleString() + " hrs",
      delta: user.researchHours - UT_MEDIAN.researchHours,
    },
  ];

  const reachCount  = schools.filter((s) => s.tier === "reach").length;
  const targetCount = schools.filter((s) => s.tier === "target").length;
  const safetyCount = schools.filter((s) => s.tier === "safety").length;

  const TIER_CFG = {
    reach:  { label: "Reach",  bg: "bg-red-500/15",     text: "text-red-400",    border: "border-red-500/25"    },
    target: { label: "Target", bg: "bg-[#BF5700]/15",   text: "text-[#BF5700]", border: "border-[#BF5700]/30"  },
    safety: { label: "Safety", bg: "bg-emerald-500/15", text: "text-emerald-400",border: "border-emerald-500/25"},
  };

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-5">

      {/* Alert Banner */}
      <div className="flex items-center gap-3 bg-[#BF5700]/10 border border-[#BF5700]/25 rounded-lg px-4 py-3 cursor-pointer hover:bg-[#BF5700]/15 transition-colors group">
        <AlertCircle size={15} className="text-[#BF5700] shrink-0" />
        <p className="text-sm text-white/70 flex-1">
          <span className="font-semibold text-[#BF5700]">
            {daysToOpen > 0
              ? `TMDSAS opens in ${daysToOpen} day${daysToOpen !== 1 ? "s" : ""}.`
              : "TMDSAS is now open."}
          </span>{" "}
          {clinicalGap > 0
            ? `Your clinical hours are ${clinicalGap.toLocaleString()} below the UT median — consider adding opportunities now.`
            : "Your clinical hours are at or above the UT median. Keep it up!"}
        </p>
        <ChevronRight size={14} className="text-white/20 shrink-0 group-hover:text-[#BF5700] transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-white/35 mt-0.5">
            Here&apos;s where you stand heading into the 2025–26 cycle.
          </p>
        </div>
        <span className="text-[11px] text-white/20 font-mono">Last updated today</span>
      </div>

      {/* Stat Band */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-5 gap-4">

        {/* Acceptance Probability */}
        <div className="col-span-2 bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col hover:border-white/20 transition-colors">
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35 mb-1">
            Acceptance Probability
          </span>
          <p className="text-[11px] text-white/25 mb-4">Based on your GPA × MCAT · AAMC 2023</p>

          <div className="relative flex items-center justify-center flex-1 min-h-[170px]">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={76}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill="#BF5700" />
                  <Cell fill={emptyFill} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-[2.6rem] font-bold text-white leading-none">
                {acceptancePct}%
              </span>
              <span className="text-[11px] text-white/35 mt-1">avg acceptance</span>
            </div>
          </div>

          <div className="mt-3 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="font-mono text-base font-semibold text-white">{user.gpa.toFixed(2)}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Your GPA</p>
            </div>
            <div>
              <p className="font-mono text-base font-semibold text-white">{user.mcat}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Your MCAT</p>
            </div>
          </div>
        </div>

        {/* My School List */}
        <div className="col-span-3 bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
              Texas Schools
            </span>
            <a
              href="/my-list"
              className="text-xs text-[#BF5700] hover:underline underline-offset-2"
            >
              View all →
            </a>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            {schools.map((school) => {
              const cfg = TIER_CFG[school.tier];
              return (
                <div
                  key={school.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.025] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-white/[0.07] flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-mono font-bold text-white/40 tracking-wider">
                      {school.abbr}
                    </span>
                  </div>
                  <span className="text-sm text-white/75 flex-1 truncate">
                    {school.name}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                  <span className="font-mono text-sm text-white/40 w-9 text-right tabular-nums">
                    {school.pct}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tier summary */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 divide-x divide-white/10 text-center">
            <div>
              <p className="font-mono text-xl font-bold text-red-400">{reachCount}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Reach</p>
            </div>
            <div>
              <p className="font-mono text-xl font-bold text-[#BF5700]">{targetCount}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Target</p>
            </div>
            <div>
              <p className="font-mono text-xl font-bold text-emerald-400">{safetyCount}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Safety</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
