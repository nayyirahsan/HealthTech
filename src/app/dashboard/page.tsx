"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { getTopSuggestions, daysUntil } from "@/lib/suggestions";
import { userProfile, utMedian, cycleDates } from "@/lib/mock-data";
import { calcProbability, tierFromProb, type Tier } from "@/lib/chance";

const USER = {
  gpa: userProfile.gpa,
  mcat: userProfile.mcat,
  clinicalHours: userProfile.clinicalHours,
  researchHours: userProfile.researchHours,
};

const UT_MEDIAN = {
  gpa: utMedian.gpa,
  mcat: utMedian.mcat,
  clinicalHours: utMedian.clinicalHours,
  researchHours: utMedian.researchHours,
};

type SchoolSeed = {
  id: number;
  name: string;
  abbr: string;
  medianGPA: number;
  medianMCAT: number;
  acceptanceRate: number;
};

type SchoolRow = SchoolSeed & {
  pct: number;
  tier: Tier;
};

const FEATURED_SCHOOLS: SchoolSeed[] = [
  { id: 1, name: "UT Southwestern", abbr: "UTSW", medianGPA: 3.91, medianMCAT: 521, acceptanceRate: 4.2 },
  { id: 2, name: "Baylor COM", abbr: "BCM", medianGPA: 3.93, medianMCAT: 522, acceptanceRate: 3.1 },
  { id: 3, name: "Texas A&M COM", abbr: "TAMU", medianGPA: 3.78, medianMCAT: 512, acceptanceRate: 7.4 },
  { id: 4, name: "UT Health Houston", abbr: "UTH", medianGPA: 3.81, medianMCAT: 514, acceptanceRate: 5.8 },
  { id: 5, name: "Mayo Clinic Alix", abbr: "MAYO", medianGPA: 3.92, medianMCAT: 522, acceptanceRate: 1.9 },
];

const SCHOOLS_FALLBACK: SchoolRow[] = FEATURED_SCHOOLS.map((school) => {
  const pct = calcProbability(USER.gpa, USER.mcat, school);
  return { ...school, pct, tier: tierFromProb(pct) };
});

const TIER_CFG: Record<Tier, { label: string; bg: string; text: string; border: string }> = {
  reach: { label: "Reach", bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/25" },
  target: { label: "Target", bg: "bg-[#BF5700]/15", text: "text-[#BF5700]", border: "border-[#BF5700]/30" },
  safety: { label: "Safety", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): SchoolSeed {
  return {
    id: row.id,
    name: row.name,
    abbr: row.name.split(" ").map((w: string) => w[0]).join("").slice(0, 5).toUpperCase(),
    medianGPA: row.median_gpa ?? 0,
    medianMCAT: row.median_mcat ?? 0,
    acceptanceRate: row.acceptance_rate ?? 0,
  };
}

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
  return "510-513";
}

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
      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">{label}</span>

      <div className="flex items-end justify-between gap-2">
        <span className="font-mono text-[2rem] font-bold text-white leading-none">{displayValue}</span>
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

      <div className="relative h-1 bg-white/10 rounded-full">
        <div className="absolute left-0 top-0 h-full bg-[#BF5700] rounded-full" style={{ width: `${userPct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-white/40" style={{ left: `${medianPct}%` }} />
      </div>

      <span className="text-[11px] text-white/25">
        UT Median: <span className="text-white/45 font-mono">{displayMedian}</span>
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const emptyFill = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)";
  const [schools, setSchools] = useState<SchoolRow[]>(SCHOOLS_FALLBACK);
  const [acceptancePct, setAcceptancePct] = useState(
    Math.round(SCHOOLS_FALLBACK.reduce((sum, school) => sum + school.pct, 0) / SCHOOLS_FALLBACK.length),
  );

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("schools")
      .select("id, name, median_gpa, median_mcat, acceptance_rate")
      .eq("state", "TX")
      .eq("type", "MD")
      .not("median_gpa", "is", null)
      .not("median_mcat", "is", null)
      .not("acceptance_rate", "is", null)
      .order("acceptance_rate", { ascending: true })
      .limit(5)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const enriched = data
            .map(mapRow)
            .map((school) => {
              const pct = calcProbability(USER.gpa, USER.mcat, school);
              return { ...school, pct, tier: tierFromProb(pct) };
            })
            .sort((a, b) => b.pct - a.pct);
          setSchools(enriched);
        }
      });

    supabase
      .from("acceptance_grid")
      .select("acceptance_rate")
      .eq("gpa_range", gpaRangeBucket(USER.gpa))
      .eq("mcat_range", mcatRangeBucket(USER.mcat))
      .limit(1)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setAcceptancePct(Math.round(data[0].acceptance_rate));
        }
      });
  }, []);

  const daysToCycle = daysUntil(cycleDates.tmdsasOpens);
  const cycleMessage =
    daysToCycle > 0
      ? `TMDSAS opens in ${daysToCycle} day${daysToCycle !== 1 ? "s" : ""}.`
      : "TMDSAS is now open.";

  const donutData = [
    { value: acceptancePct },
    { value: 100 - acceptancePct },
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
      displayMedian: `${UT_MEDIAN.clinicalHours.toLocaleString()} hrs`,
      delta: USER.clinicalHours - UT_MEDIAN.clinicalHours,
    },
    {
      label: "Research Hours",
      displayValue: USER.researchHours.toLocaleString(),
      userPct: (USER.researchHours / 1000) * 100,
      medianPct: (UT_MEDIAN.researchHours / 1000) * 100,
      displayMedian: `${UT_MEDIAN.researchHours.toLocaleString()} hrs`,
      delta: USER.researchHours - UT_MEDIAN.researchHours,
    },
  ];

  const reachCount = schools.filter((school) => school.tier === "reach").length;
  const targetCount = schools.filter((school) => school.tier === "target").length;
  const safetyCount = schools.filter((school) => school.tier === "safety").length;
  const suggestions = getTopSuggestions(USER, UT_MEDIAN, daysToCycle, 2);

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-5">
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <Link
            key={suggestion.title}
            href={suggestion.ctaHref}
            className="flex items-center gap-3 bg-[#BF5700]/10 border border-[#BF5700]/25 rounded-lg px-4 py-3 hover:bg-[#BF5700]/15 transition-colors group"
          >
            <AlertCircle size={15} className="text-[#BF5700] shrink-0" />
            <p className="text-sm text-white/70 flex-1">
              {i === 0 && (
                <>
                  <span className="font-semibold text-[#BF5700]">{cycleMessage}</span>{" "}
                </>
              )}
              {suggestion.description}
            </p>
            <ChevronRight size={14} className="text-white/20 shrink-0 group-hover:text-[#BF5700] transition-colors" />
          </Link>
        ))}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Welcome back, {userProfile.firstName}</h1>
          <p className="text-sm text-white/35 mt-0.5">Here&apos;s where you stand heading into the {userProfile.appCycle} cycle.</p>
        </div>
        <span className="text-[11px] text-white/20 font-mono">Last updated today</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col hover:border-white/20 transition-colors">
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35 mb-1">
            Acceptance Probability
          </span>
          <p className="text-[11px] text-white/25 mb-4">Based on your GPA × MCAT bucket</p>

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
              <span className="font-mono text-[2.6rem] font-bold text-white leading-none">{acceptancePct}%</span>
              <span className="text-[11px] text-white/35 mt-1">estimated acceptance</span>
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

        <div className="col-span-3 bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">Texas Schools</span>
            <Link href="/schools" className="text-xs text-[#BF5700] hover:underline underline-offset-2">
              View all →
            </Link>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            {schools.map((school) => {
              const cfg = TIER_CFG[school.tier];
              return (
                <Link
                  key={school.id}
                  href={`/schools/${school.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.025] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-white/[0.07] flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-mono font-bold text-white/40 tracking-wider">{school.abbr}</span>
                  </div>
                  <span className="text-sm text-white/75 flex-1 truncate">{school.name}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                  <span className="font-mono text-sm text-white/40 w-9 text-right tabular-nums">{school.pct}%</span>
                </Link>
              );
            })}
          </div>

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
