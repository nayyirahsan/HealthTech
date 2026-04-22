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
import { gpaComparisonData, mcatSectionData, activityHoursData } from "@/lib/mock-data";

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

export function GPAChart() {
  return (
    <ChartCard
      title="GPA vs. Benchmarks"
      icon={<TrendingUp className="w-4 h-4 text-orange-600" />}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={gpaComparisonData} barGap={2}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[3.0, 4.0]} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="gpa" name="Cumulative" fill={ORANGE} radius={[4, 4, 0, 0]} barSize={20}>
            {gpaComparisonData.map((_, i) => (
              <Cell key={i} fill={i === 0 ? ORANGE : GRAY} />
            ))}
          </Bar>
          <Bar dataKey="sciGpa" name="Science" fill={ORANGE_LIGHT} radius={[4, 4, 0, 0]} barSize={20}>
            {gpaComparisonData.map((_, i) => (
              <Cell key={i} fill={i === 0 ? ORANGE_LIGHT : "#d1d5db"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MCATChart() {
  return (
    <ChartCard
      title="MCAT Section Breakdown"
      icon={<Brain className="w-4 h-4 text-orange-600" />}
    >
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={mcatSectionData} outerRadius="70%">
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

export function ActivityChart() {
  return (
    <ChartCard
      title="Activity Hours"
      icon={<Clock className="w-4 h-4 text-orange-600" />}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={activityHoursData} layout="vertical" barGap={2}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={70} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="hours" name="Your Hours" fill={ORANGE} radius={[0, 4, 4, 0]} barSize={14} />
          <Bar dataKey="benchmark" name="Benchmark" fill="#e5e7eb" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProfileCharts() {
  return (
    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <GPAChart />
      <MCATChart />
      <ActivityChart />
    </div>
  );
}
