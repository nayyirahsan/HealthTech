"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Brain, Clock } from "lucide-react";
import type { UserProfileRow } from "@/lib/user-profile";
import {
  MCAT_SECTION_MEDIANS,
  type BenchmarkRow,
} from "@/lib/recommendations";

const ORANGE = "#ea580c";
const ORANGE_LIGHT = "#fdba74";
const GRAY = "#9ca3af";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 12,
};

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function bench(rows: BenchmarkRow[], metric: string, fallback: number): number {
  const row = rows.find((r) => r.metric === metric);
  return row ? Number(row.median_value) : fallback;
}

interface ChartProps {
  profile: UserProfileRow | null | undefined;
  benchmarks: BenchmarkRow[];
}

export function GPAChart({ profile, benchmarks }: ChartProps) {
  const utGpa = bench(benchmarks, "gpa", 3.82);
  const data = [
    { label: "You", gpa: profile?.gpa ?? 0, sciGpa: profile?.science_gpa ?? 0 },
    { label: "UT Median", gpa: utGpa, sciGpa: utGpa },
  ];
  return (
    <ChartCard
      title="GPA vs. UT Median"
      icon={<TrendingUp className="w-4 h-4 text-orange-600" />}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={2}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[3.0, 4.0]} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="gpa" name="Cumulative" fill={ORANGE} radius={[4, 4, 0, 0]} barSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? ORANGE : GRAY} />
            ))}
          </Bar>
          <Bar dataKey="sciGpa" name="Science" fill={ORANGE_LIGHT} radius={[4, 4, 0, 0]} barSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? ORANGE_LIGHT : "#d1d5db"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MCATChart({ profile }: ChartProps) {
  const breakdown = profile?.mcat_breakdown;
  const data = [
    { section: "C/P", you: breakdown?.chem_phys ?? 0, median: MCAT_SECTION_MEDIANS.chem_phys },
    { section: "CARS", you: breakdown?.cars ?? 0, median: MCAT_SECTION_MEDIANS.cars },
    { section: "B/B", you: breakdown?.bio ?? 0, median: MCAT_SECTION_MEDIANS.bio },
    { section: "P/S", you: breakdown?.psych ?? 0, median: MCAT_SECTION_MEDIANS.psych },
  ];
  return (
    <ChartCard
      title="MCAT Section Breakdown"
      icon={<Brain className="w-4 h-4 text-orange-600" />}
    >
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="section" tick={{ fontSize: 12 }} />
          <Radar name="You" dataKey="you" stroke={ORANGE} fill={ORANGE} fillOpacity={0.25} />
          <Radar name="Median" dataKey="median" stroke={GRAY} fill={GRAY} fillOpacity={0.1} />
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ActivityChart({ profile, benchmarks }: ChartProps) {
  const data = [
    { category: "Clinical",  hours: profile?.clinical_hours  ?? 0, benchmark: bench(benchmarks, "clinical_hours",  1200) },
    { category: "Research",  hours: profile?.research_hours  ?? 0, benchmark: bench(benchmarks, "research_hours",  600)  },
    { category: "Volunteer", hours: profile?.volunteer_hours ?? 0, benchmark: bench(benchmarks, "volunteer_hours", 250)  },
    { category: "Shadowing", hours: profile?.shadowing_hours ?? 0, benchmark: bench(benchmarks, "shadowing_hours", 120)  },
  ];
  return (
    <ChartCard
      title="Activity Hours"
      icon={<Clock className="w-4 h-4 text-orange-600" />}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" barGap={2}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={70} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="hours" name="Your Hours" fill={ORANGE} radius={[0, 4, 4, 0]} barSize={14} />
          <Bar dataKey="benchmark" name="UT Median" fill="#e5e7eb" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
