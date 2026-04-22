"use client";

import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useAuth, useTheme } from "@/app/providers";
import { utMedian } from "@/lib/mock-data";
import { resolveUserProfile } from "@/lib/user-profile";

const UT_MEDIAN = {
  gpa: utMedian.gpa,
  mcat: utMedian.mcat,
  clinicalHours: utMedian.clinicalHours,
  researchHours: utMedian.researchHours,
  volunteerHours: utMedian.volunteerHours,
  shadowingHours: utMedian.shadowingHours,
};

const AXIS_MAX = {
  gpa: 4.0,
  mcat: 528,
  clinicalHours: 2000,
  researchHours: 1000,
  volunteerHours: 400,
  shadowingHours: 200,
};

function norm(value: number, key: keyof typeof AXIS_MAX) {
  return Math.round((Math.min(value, AXIS_MAX[key]) / AXIS_MAX[key]) * 100);
}

const STATS: {
  key: "gpa" | "mcat" | "clinicalHours" | "researchHours" | "volunteerHours" | "shadowingHours";
  label: string;
  unit: string;
  format: (v: number) => string;
  cta: string;
}[] = [
  { key: "gpa", label: "GPA", unit: "", format: (v) => v.toFixed(2), cta: "Improve GPA" },
  { key: "mcat", label: "MCAT", unit: "", format: (v) => v.toString(), cta: "Improve MCAT" },
  { key: "clinicalHours", label: "Clinical Hours", unit: " hrs", format: (v) => v.toLocaleString(), cta: "Find Clinical Opportunities" },
  { key: "researchHours", label: "Research Hours", unit: " hrs", format: (v) => v.toLocaleString(), cta: "Find Research Opportunities" },
  { key: "volunteerHours", label: "Volunteer Hours", unit: " hrs", format: (v) => v.toLocaleString(), cta: "Find Volunteer Opportunities" },
  { key: "shadowingHours", label: "Shadowing Hours", unit: " hrs", format: (v) => v.toLocaleString(), cta: "Find Shadowing Opportunities" },
];

function CustomRadarDot(props: { cx?: number; cy?: number; fill?: string }) {
  const { cx = 0, cy = 0, fill } = props;
  return <circle cx={cx} cy={cy} r={3} fill={fill} stroke="none" />;
}

function StatCard({
  label,
  userValue,
  medianValue,
  format,
  unit,
  cta,
}: {
  label: string;
  userValue: number;
  medianValue: number;
  format: (v: number) => string;
  unit: string;
  cta: string;
}) {
  const delta = userValue - medianValue;
  const isAbove = delta >= 0;
  const deltaAbs = Math.abs(delta);
  const deltaStr = format(deltaAbs) + unit;

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">{label}</span>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[2rem] font-bold text-white leading-none">
            {format(userValue)}
            {unit}
          </p>
          <p className="text-[11px] text-white/30 mt-1.5">
            UT Median:{" "}
            <span className="text-white/50 font-mono">
              {format(medianValue)}
              {unit}
            </span>
          </p>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 ${
            isAbove ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {isAbove ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isAbove ? "+" : "−"}
          {deltaStr}
        </div>
      </div>

      <div className="relative h-1 bg-white/10 rounded-full">
        <div
          className={`absolute left-0 top-0 h-full rounded-full ${isAbove ? "bg-[#BF5700]" : "bg-red-500/60"}`}
          style={{ width: `${Math.min((userValue / (medianValue * 1.5)) * 100, 100)}%` }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-white/40" style={{ left: `${Math.min((medianValue / (medianValue * 1.5)) * 100, 100)}%` }} />
      </div>

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

export default function UTBenchmarksPage() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const currentUser = resolveUserProfile(profile);
  const USER = {
    gpa: currentUser.gpa,
    mcat: currentUser.mcat,
    clinicalHours: currentUser.clinicalHours,
    researchHours: currentUser.researchHours,
    volunteerHours: currentUser.volunteerHours,
    shadowingHours: currentUser.shadowingHours,
  };
  const RADAR_DATA = [
    { axis: "GPA", user: norm(USER.gpa, "gpa"), median: norm(UT_MEDIAN.gpa, "gpa") },
    { axis: "MCAT", user: norm(USER.mcat, "mcat"), median: norm(UT_MEDIAN.mcat, "mcat") },
    { axis: "Clinical", user: norm(USER.clinicalHours, "clinicalHours"), median: norm(UT_MEDIAN.clinicalHours, "clinicalHours") },
    { axis: "Research", user: norm(USER.researchHours, "researchHours"), median: norm(UT_MEDIAN.researchHours, "researchHours") },
    { axis: "Volunteer", user: norm(USER.volunteerHours, "volunteerHours"), median: norm(UT_MEDIAN.volunteerHours, "volunteerHours") },
    { axis: "Shadowing", user: norm(USER.shadowingHours, "shadowingHours"), median: norm(UT_MEDIAN.shadowingHours, "shadowingHours") },
  ];
  const isLight = theme === "light";
  const gridStroke = isLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.08)";
  const medianStroke = isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)";
  const medianFill = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)";
  const tickFill = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.40)";
  const dotFill = isLight ? "rgba(0,0,0,0.40)" : "rgba(255,255,255,0.40)";

  const aheadCount = STATS.filter(({ key }) => USER[key] >= UT_MEDIAN[key]).length;
  const behindCount = STATS.length - aheadCount;

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">UT Benchmarks</h1>
          <p className="text-sm text-white/35 mt-0.5">How you compare to UT Austin admitted students · HPO data 2021–2023</p>
        </div>

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

      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">Profile Comparison</span>
          <span className="text-[11px] text-white/20 font-mono">normalised 0–100</span>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke={gridStroke} gridType="polygon" />
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
            <Radar name="UT Admitted Median" dataKey="median" stroke={medianStroke} strokeWidth={1.5} fill={medianFill} dot={<CustomRadarDot fill={dotFill} />} />
            <Radar name="You" dataKey="user" stroke="#BF5700" strokeWidth={2} fill="rgba(191,87,0,0.15)" dot={<CustomRadarDot fill="#BF5700" />} />
            <Legend content={<RadarLegend />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {STATS.map(({ key, label, unit, format, cta }) => (
          <StatCard key={key} label={label} userValue={USER[key]} medianValue={UT_MEDIAN[key]} format={format} unit={unit} cta={cta} />
        ))}
      </div>

      <p className="text-[11px] text-white/20 text-center font-mono pb-2">
        Source: UT Austin HPO Reports 2021–2023 · Medians reflect admitted applicants across TMDSAS, AMCAS, and AACOMAS
      </p>
    </div>
  );
}
