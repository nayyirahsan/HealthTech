"use client";

import { useEffect, useState } from "react";
import { Calendar, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const systemColors: Record<string, string> = {
  TMDSAS: "border-l-orange-500",
  AMCAS: "border-l-blue-500",
  Both: "border-l-purple-500",
};

interface DeadlineRow {
  id: number;
  label: string;
  date: string;
  system: "AMCAS" | "TMDSAS" | "Both";
  type: "milestone" | "submission" | "deadline";
}

interface UpcomingDeadline {
  id: number;
  title: string;
  dateLabel: string;
  system: string;
  daysAway: number;
  urgent: boolean;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00").getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86_400_000);
}

export function DeadlineCards() {
  const [items, setItems] = useState<UpcomingDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("application_deadlines")
      .select("id, label, date, system, type")
      .order("date", { ascending: true })
      .then((res: { data: DeadlineRow[] | null }) => {
        if (res.data) {
          const mapped = res.data
            .map((row) => {
              const days = daysUntil(row.date);
              return {
                id: row.id,
                title: row.label,
                dateLabel: fmtDate(row.date),
                system: row.system,
                daysAway: days,
                urgent: days >= 0 && days <= 14,
              };
            })
            .filter((d) => d.daysAway >= 0)
            .slice(0, 6);
          setItems(mapped);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading deadlines…</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No upcoming deadlines on file.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-orange-600" />
        <h3 className="text-sm font-semibold text-gray-900">Upcoming Deadlines</h3>
      </div>
      <div className="space-y-3">
        {items.map((d) => (
          <div
            key={d.id}
            className={`rounded-lg border border-gray-200 border-l-4 p-4 ${
              systemColors[d.system] || "border-l-gray-400"
            } ${d.urgent ? "bg-red-50 border-red-200" : "bg-white"} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-sm font-medium ${d.urgent ? "text-red-900" : "text-gray-900"}`}>
                  {d.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{d.dateLabel}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {d.urgent && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    d.urgent
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {d.daysAway}d away
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
