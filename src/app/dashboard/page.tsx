"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  AlertCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// ── Mock Data ────────────────────────────────────────────────────────────────

const USER = {
  name: "Alex",
  gpa: 3.75,
  mcat: 512,
  clinicalHours: 850,
  researchHours: 400,
};

const UT_MEDIAN = {
  gpa: 3.82,
  mcat: 513,
  clinicalHours: 1200,
  researchHours: 600,
};

const ACCEPTANCE_PCT = 42;
const DAYS_TO_CYCLE = 50;

const SCHOOLS = [
  { name: "UT Southwestern",  abbr: "UTSW", tier: "target" as const, pct: 48 },
  { name: "Baylor COM",       abbr: "BCM",  tier: "reach"  as const, pct: 22 },
  { name: "Texas A&M COM",    abbr: "TAMU", tier: "target" as const, pct: 51 },
  { name: "UT Health Houston",abbr: "UTH",  tier: "safety" as const, pct: 67 },
  { name: "Mayo Clinic Alix", abbr: "MAYO", tier: "reach"  as const, pct: 8  },
];

const TIER_CFG = {
  reach:  { label: "Reach",  bg: "bg-red-500/15",       text: "text-red-400",    border: "border-red-500/25"       },
  target: { label: "Target", bg: "bg-[#BF5700]/15",     text: "text-[#BF5700]", border: "border-[#BF5700]/30"     },
  safety: { label: "Safety", bg: "bg-emerald-500/15",   text: "text-emerald-400",border: "border-emerald-500/25"  },
};

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
  const donutData = [
    { value: ACCEPTANCE_PCT },
    { value: 100 - ACCEPTANCE_PCT },
  ];

  const stats = [
    {
      label: "GPA",
      displayValue: USER.gpa.toFixed(2),
      userPct: (USER.gpa / 4.0) * 100,
      medianPct: (UT_MEDIAN.gpa / 4.0) * 100,
      displayMedian: UT_MEDIAN.gpa.toFixed(2),
      delta: USER.gpa - UT_MEDIAN.gpa,
    },
    {
      label: "MCAT",
      displayValue: USER.mcat.toString(),
      userPct: (USER.mcat / 528) * 100,
      medianPct: (UT_MEDIAN.mcat / 528) * 100,
      displayMedian: UT_MEDIAN.mcat.toString(),
      delta: USER.mcat - UT_MEDIAN.mcat,
    },
    {
      label: "Clinical Hours",
      displayValue: USER.clinicalHours.toLocaleString(),
      userPct: (USER.clinicalHours / 2000) * 100,
      medianPct: (UT_MEDIAN.clinicalHours / 2000) * 100,
      displayMedian: UT_MEDIAN.clinicalHours.toLocaleString() + " hrs",
      delta: USER.clinicalHours - UT_MEDIAN.clinicalHours,
    },
    {
      label: "Research Hours",
      displayValue: USER.researchHours.toLocaleString(),
      userPct: (USER.researchHours / 1000) * 100,
      medianPct: (UT_MEDIAN.researchHours / 1000) * 100,
      displayMedian: UT_MEDIAN.researchHours.toLocaleString() + " hrs",
      delta: USER.researchHours - UT_MEDIAN.researchHours,
    },
  ];

  const reachCount  = SCHOOLS.filter((s) => s.tier === "reach").length;
  const targetCount = SCHOOLS.filter((s) => s.tier === "target").length;
  const safetyCount = SCHOOLS.filter((s) => s.tier === "safety").length;

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-5">

      {/* Alert Banner */}
      <div className="flex items-center gap-3 bg-[#BF5700]/10 border border-[#BF5700]/25 rounded-lg px-4 py-3 cursor-pointer hover:bg-[#BF5700]/15 transition-colors group">
        <AlertCircle size={15} className="text-[#BF5700] shrink-0" />
        <p className="text-sm text-white/70 flex-1">
          <span className="font-semibold text-[#BF5700]">
            TMDSAS opens in {DAYS_TO_CYCLE} days.
          </span>{" "}
          Your clinical hours are 350 below the UT median — consider adding opportunities now.
        </p>
        <ChevronRight size={14} className="text-white/20 shrink-0 group-hover:text-[#BF5700] transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {USER.name}
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
                  <Cell fill="rgba(255,255,255,0.05)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-[2.6rem] font-bold text-white leading-none">
                {ACCEPTANCE_PCT}%
              </span>
              <span className="text-[11px] text-white/35 mt-1">avg acceptance</span>
            </div>
          </div>

          <div className="mt-3 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="font-mono text-base font-semibold text-white">{USER.gpa.toFixed(2)}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Your GPA</p>
            </div>
            <div>
              <p className="font-mono text-base font-semibold text-white">{USER.mcat}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Your MCAT</p>
            </div>
          </div>
        </div>

        {/* My School List */}
        <div className="col-span-3 bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
              My School List
            </span>
            <a
              href="/my-list"
              className="text-xs text-[#BF5700] hover:underline underline-offset-2"
            >
              View all →
            </a>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            {SCHOOLS.map((school) => {
              const cfg = TIER_CFG[school.tier];
              return (
                <div
                  key={school.name}
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
