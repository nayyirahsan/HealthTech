"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ClipboardList,
  School,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/providers";
import { buildProfileActivityRows } from "@/lib/activity-tasks";

// ── Types ─────────────────────────────────────────────────────────────────────

type System = "AMCAS" | "TMDSAS" | "Both";
type FilterMode = "All" | "AMCAS" | "TMDSAS" | "Personal";
type Decision = "accepted" | "waitlisted" | "rejected" | null;

interface MasterDeadline {
  id: string;
  deadlineKey: string;
  label: string;
  date: string;
  system: System;
  type: "milestone" | "submission" | "deadline";
  description: string;
  completed: boolean;
}

interface PersonalTask {
  id: string;
  label: string;
  dueDate: string;
  completed: boolean;
}

interface SchoolEntry {
  id: string;
  name: string;
  abbr: string;
  system: "AMCAS" | "TMDSAS";
  applied: string | null;
  secondaryReceived: string | null;
  secondarySubmitted: string | null;
  interviewInvite: string | null;
  interviewDate: string | null;
  decision: Decision;
}

interface ActivityRow {
  id: number;
  name: string;
  category: "Clinical" | "Research" | "Volunteering" | "Shadowing" | "Leadership" | "Other";
  hours: number;
  end_date: string | null;
}

interface DeadlineRow {
  id: number;
  key: string;
  label: string;
  date: string;
  system: System;
  type: "milestone" | "submission" | "deadline";
  description: string;
}

interface DeadlineProgressRow {
  deadline_key: string;
  completed: boolean;
}

interface SchoolApplicationRow {
  id: number;
  school_name: string;
  school_abbr: string;
  system: "AMCAS" | "TMDSAS";
  applied: string | null;
  secondary_received: string | null;
  secondary_submitted: string | null;
  interview_invite: string | null;
  interview_date: string | null;
  decision: Decision;
}

const TODAY = new Date();

const CATEGORY_MEDIANS: Record<ActivityRow["category"], number> = {
  Clinical: 1200,
  Research: 600,
  Volunteering: 250,
  Shadowing: 120,
  Leadership: 75,
  Other: 100,
};


const SCHOOL_STAGES = [
  { key: "applied",            label: "Applied"    },
  { key: "secondaryReceived",  label: "Sec. Rcvd"  },
  { key: "secondarySubmitted", label: "Sec. Sub."  },
  { key: "interviewInvite",    label: "II"         },
  { key: "interviewDate",      label: "Interview"  },
  { key: "decision",           label: "Decision"   },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - TODAY.getTime()) / 86_400_000);
}

function fmtShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtMonthYear(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function buildActivityTasks(rows: ActivityRow[]): PersonalTask[] {
  if (rows.length === 0) return [];

  const completionTasks: PersonalTask[] = rows
    .filter((r) => r.end_date)
    .sort((a, b) => (a.end_date ?? "").localeCompare(b.end_date ?? ""))
    .slice(0, 6)
    .map((r) => ({
      id: `a-${r.id}`,
      label: `Finalize reflection for ${r.name}`,
      dueDate: r.end_date ?? TODAY.toISOString().slice(0, 10),
      completed: daysUntil(r.end_date ?? TODAY.toISOString().slice(0, 10)) < 0,
    }));

  const totals = rows.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.hours;
    return acc;
  }, {} as Record<ActivityRow["category"], number>);

  const benchmarkTasks: PersonalTask[] = Object.entries(CATEGORY_MEDIANS)
    .map(([category, median]) => {
      const current = totals[category as ActivityRow["category"]] ?? 0;
      if (current >= median) return null;
      return {
        id: `gap-${category}`,
        label: `Add ${(median - current).toLocaleString()} ${category.toLowerCase()} hours to reach UT median`,
        dueDate: "2026-05-15",
        completed: false,
      };
    })
    .filter((task): task is PersonalTask => Boolean(task))
    .slice(0, 3);

  return [...completionTasks, ...benchmarkTasks];
}

function mapDeadlineRow(row: DeadlineRow, completed: boolean): MasterDeadline {
  return {
    id: String(row.id),
    deadlineKey: row.key,
    label: row.label,
    date: row.date,
    system: row.system,
    type: row.type,
    description: row.description,
    completed,
  };
}

function mapSchoolRow(row: SchoolApplicationRow): SchoolEntry {
  return {
    id: String(row.id),
    name: row.school_name,
    abbr: row.school_abbr,
    system: row.system,
    applied: row.applied,
    secondaryReceived: row.secondary_received,
    secondarySubmitted: row.secondary_submitted,
    interviewInvite: row.interview_invite,
    interviewDate: row.interview_date,
    decision: row.decision,
  };
}

function getStatusConfig(d: MasterDeadline) {
  if (d.completed) return { dot: "bg-emerald-500",         ring: "ring-emerald-500/30",     text: "text-emerald-400",  label: "Done" };
  const days = daysUntil(d.date);
  if (days < 0)    return { dot: "bg-red-500",              ring: "ring-red-500/30",          text: "text-red-400",      label: `${Math.abs(days)}d overdue` };
  if (days <= 7)   return { dot: "bg-[#BF5700] animate-pulse", ring: "ring-[#BF5700]/50",    text: "text-[#BF5700]",    label: `${days}d left` };
  if (days <= 30)  return { dot: "bg-[#BF5700]",            ring: "ring-[#BF5700]/25",        text: "text-[#BF5700]",    label: `${days}d left` };
  return            { dot: "bg-white/20",                   ring: "ring-white/10",            text: "text-white/30",     label: `${days}d` };
}

function schoolProgress(school: SchoolEntry) {
  const filled = SCHOOL_STAGES.filter(s => (school as unknown as Record<string, unknown>)[s.key]).length;
  return { filled, pct: Math.round((filled / SCHOOL_STAGES.length) * 100) };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SystemBadge({ system }: { system: System }) {
  const cfg =
    system === "AMCAS"  ? "bg-blue-500/15 text-blue-300 border-blue-500/20" :
    system === "TMDSAS" ? "bg-[#BF5700]/15 text-[#BF5700] border-[#BF5700]/25" :
                          "bg-purple-500/10 text-purple-300 border-purple-500/20";
  return (
    <span className={`text-[9px] font-medium tracking-widest px-1.5 py-0.5 rounded border ${cfg}`}>
      {system}
    </span>
  );
}

function CountdownCard({ label, date }: { label: string; date: string }) {
  const days     = daysUntil(date);
  const isPast   = days < 0;
  const isUrgent = !isPast && days <= 3;
  const isSoon   = !isPast && days <= 30;
  return (
    <div className={`flex-1 min-w-[130px] rounded-xl border p-4 flex flex-col gap-1.5 transition-colors ${
      isUrgent ? "bg-[#BF5700]/10 border-[#BF5700]/40" :
      isSoon   ? "bg-[#BF5700]/[0.06] border-[#BF5700]/20" :
                 "bg-white/[0.04] border-white/10"
    }`}>
      <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-white/35 leading-tight">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-mono text-[2rem] font-bold leading-none ${
          isUrgent ? "text-[#BF5700]" : isPast ? "text-white/25" : "text-white"
        }`}>
          {Math.abs(days)}
        </span>
        <span className={`text-xs ${isPast ? "text-white/20" : isSoon ? "text-[#BF5700]/60" : "text-white/35"}`}>
          {isPast ? "days ago" : "days"}
        </span>
      </div>
      <span className="text-[11px] text-white/30 font-mono">{fmtShort(date)}</span>
    </div>
  );
}

interface LabeledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
function LabeledInput({ label, ...props }: LabeledInputProps) {
  return (
    <div>
      <label className="text-[9px] font-medium tracking-[0.14em] uppercase text-white/35 block mb-1">{label}</label>
      <input
        {...props}
        className="w-full text-sm bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#BF5700]/50 transition-colors"
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { user, profile } = useAuth();
  const [filter, setFilter]         = useState<FilterMode>("All");
  const [tasks, setTasks]           = useState<PersonalTask[]>([]);
  const [schools, setSchools]       = useState<SchoolEntry[]>([]);
  const [masterDeadlines, setMasterDeadlines] = useState<MasterDeadline[]>([]);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [taskLabel, setTaskLabel]   = useState("");
  const [taskDate, setTaskDate]     = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);

  const [draft, setDraft] = useState({
    name: "", abbr: "", system: "TMDSAS" as "AMCAS" | "TMDSAS",
    applied: "", secondaryReceived: "", secondarySubmitted: "",
    interviewInvite: "", interviewDate: "", decision: "" as Decision | "",
  });

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("activities")
      .select("id, name, category, hours, end_date")
      .eq("user_id", user.id)
      .then((res: { data: unknown; error: unknown }) => {
        const data = res.data as ActivityRow[] | null;
        const error = res.error;
        if (!error && data && data.length > 0) {
          setTasks(buildActivityTasks(data));
        } else {
          setTasks(buildActivityTasks(buildProfileActivityRows(profile) as ActivityRow[]));
        }
        setLoadingTasks(false);
      });
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    Promise.all([
      supabase
        .from("application_deadlines")
        .select("id, key, label, date, system, type, description")
        .order("date", { ascending: true }),
      supabase
        .from("deadline_progress")
        .select("deadline_key, completed")
        .eq("user_id", user.id),
    ]).then(([dlRes, progRes]) => {
      if (dlRes.data) {
        const progressMap = new Map<string, boolean>(
          ((progRes.data ?? []) as DeadlineProgressRow[]).map((p) => [p.deadline_key, p.completed])
        );
        setMasterDeadlines(
          (dlRes.data as DeadlineRow[]).map((row) =>
            mapDeadlineRow(row, progressMap.get(row.key) ?? false)
          )
        );
      }
      setLoadingTimeline(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("school_applications")
      .select("id, school_name, school_abbr, system, applied, secondary_received, secondary_submitted, interview_invite, interview_date, decision")
      .eq("user_id", user.id)
      .order("school_name", { ascending: true })
      .then((res: { data: unknown; error: unknown }) => {
        const data = res.data as SchoolApplicationRow[] | null;
        const error = res.error;
        if (!error && data) {
          setSchools(data.map((row) => mapSchoolRow(row)));
        }
        setLoadingSchools(false);
      });
  }, [user]);

  async function toggleDeadline(deadlineKey: string) {
    if (!user) return;
    const target = masterDeadlines.find((d) => d.deadlineKey === deadlineKey);
    if (!target) return;
    const next = !target.completed;
    setMasterDeadlines((prev) =>
      prev.map((d) => (d.deadlineKey === deadlineKey ? { ...d, completed: next } : d))
    );
    const supabase = createClient();
    await supabase
      .from("deadline_progress")
      .upsert(
        { user_id: user.id, deadline_key: deadlineKey, completed: next, updated_at: new Date().toISOString() },
        { onConflict: "user_id,deadline_key" }
      );
  }

  // Filtered & grouped timeline
  const filtered = useMemo(() => {
    if (filter === "Personal") return [];
    return masterDeadlines.filter(d => {
      if (filter === "All") return true;
      return d.system === filter || d.system === "Both";
    });
  }, [filter, masterDeadlines]);

  const byMonth = useMemo(() => {
    const groups: [string, MasterDeadline[]][] = [];
    const map: Record<string, MasterDeadline[]> = {};
    for (const d of filtered) {
      const k = fmtMonthYear(d.date);
      if (!map[k]) { map[k] = []; groups.push([k, map[k]]); }
      map[k].push(d);
    }
    return groups;
  }, [filtered]);

  function toggleTask(id: string) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }
  function removeTask(id: string) {
    setTasks(ts => ts.filter(t => t.id !== id));
  }
  function addTask() {
    if (!taskLabel.trim()) return;
    setTasks(ts => [...ts, {
      id: uid(), label: taskLabel.trim(),
      dueDate: taskDate || TODAY.toISOString().slice(0, 10),
      completed: false,
    }]);
    setTaskLabel(""); setTaskDate("");
  }

  function addSchool() {
    if (!draft.name.trim() || !user) return;
    const payload = {
      user_id: user.id,
      school_name: draft.name.trim(),
      school_abbr: draft.abbr.trim() || draft.name.slice(0, 4).toUpperCase(),
      system: draft.system,
      applied: draft.applied || null,
      secondary_received: draft.secondaryReceived || null,
      secondary_submitted: draft.secondarySubmitted || null,
      interview_invite: draft.interviewInvite || null,
      interview_date: draft.interviewDate || null,
      decision: (draft.decision as Decision) || null,
    };
    const supabase = createClient();
    supabase
      .from("school_applications")
      .insert(payload)
      .select("id, school_name, school_abbr, system, applied, secondary_received, secondary_submitted, interview_invite, interview_date, decision")
      .single()
      .then((res: { data: unknown; error: unknown }) => {
        const data = res.data as SchoolApplicationRow | null;
        const error = res.error;
        if (!error && data) {
          setSchools((ss) => [...ss, mapSchoolRow(data)]);
        }
      });
    setDialogOpen(false);
    setDraft({ name: "", abbr: "", system: "TMDSAS", applied: "", secondaryReceived: "", secondarySubmitted: "", interviewInvite: "", interviewDate: "", decision: "" });
  }

  const completedCount = masterDeadlines.filter(d => d.completed).length;
  const showTimeline   = filter !== "Personal";
  const showTasks      = filter === "All" || filter === "Personal";

  const COUNTDOWN = masterDeadlines
    .filter((d) => !d.completed)
    .slice(0, 3)
    .map((d) => ({ label: d.label, date: d.date }));

  const FILTERS: FilterMode[] = ["All", "AMCAS", "TMDSAS", "Personal"];

  return (
    <div className="min-h-screen bg-[#0F172A] px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[1.6rem] font-bold text-white tracking-tight leading-none">
              Application Timeline
            </h1>
            <span className="text-[9px] font-semibold tracking-[0.18em] uppercase px-2 py-1 rounded-md bg-[#BF5700]/15 text-[#BF5700] border border-[#BF5700]/25 mt-0.5">
              2025–26
            </span>
          </div>
          <p className="text-sm text-white/35">AMCAS · TMDSAS · personal milestones in one view</p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] gap-0.5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-[#BF5700] text-white shadow"
                  : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
              }`}
            >
              {f === "Personal" ? "Tasks" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Countdown Row */}
      <div className="flex flex-wrap gap-3 mb-7">
        {COUNTDOWN.map(c => <CountdownCard key={`${c.label}-${c.date}`} {...c} />)}

        {/* Completion meter */}
        <div className="flex-1 min-w-[130px] rounded-xl border bg-white/[0.04] border-white/10 p-4 flex flex-col gap-1.5">
          <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-white/35">Deadlines Hit</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[2rem] font-bold leading-none text-emerald-400">{completedCount}</span>
            <span className="text-xs text-white/30">/ {masterDeadlines.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${masterDeadlines.length ? Math.round((completedCount / masterDeadlines.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main two-column grid */}
      <div className={`grid gap-6 mb-7 ${
        showTimeline && showTasks
          ? "grid-cols-1 lg:grid-cols-[1fr_316px]"
          : "grid-cols-1"
      }`}>

        {/* ── Timeline ── */}
        {showTimeline && (
          <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.07]">
              <Calendar size={13} className="text-[#BF5700]" />
              <span className="text-sm font-semibold text-white">Master Timeline</span>
              <span className="ml-auto text-[10px] text-white/25">{filtered.length} events</span>
            </div>
            {loadingTimeline && <div className="px-5 py-4 text-xs text-white/35">Loading timeline data...</div>}
            {!loadingTimeline && filtered.length === 0 && (
              <div className="px-5 py-6 text-sm text-white/35">No timeline deadlines found in Supabase.</div>
            )}

            {byMonth.map(([month, deadlines]) => (
              <div key={month}>
                <div className="px-5 py-2 bg-white/[0.018] border-b border-white/[0.04] border-t border-t-white/[0.04]">
                  <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-white/25">{month}</span>
                </div>
                <div className="relative">
                  {/* Vertical rail */}
                  <div className="absolute left-[27px] top-0 bottom-0 w-px bg-white/[0.07] pointer-events-none" />

                  {deadlines.map(d => {
                    const st     = getStatusConfig(d);
                    const isOpen = expanded === d.id;
                    return (
                      <div key={d.id} className="border-b border-white/[0.04] last:border-0">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpanded(isOpen ? null : d.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setExpanded(isOpen ? null : d.id);
                          }}
                          className="w-full cursor-pointer text-left flex items-start gap-3.5 px-5 py-3 hover:bg-white/[0.025] transition-colors"
                        >
                          {/* Toggle dot — click to mark complete */}
                          <button
                            type="button"
                            aria-pressed={d.completed}
                            onClick={(e) => { e.stopPropagation(); toggleDeadline(d.deadlineKey); }}
                            className="relative flex-shrink-0 z-10 mt-[3px] cursor-pointer"
                            title={d.completed ? "Mark incomplete" : "Mark complete"}
                          >
                            <span className={`block w-3 h-3 rounded-full ring-2 ${st.dot} ${st.ring}`} />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <span className={`text-[13px] font-medium leading-snug ${d.completed ? "line-through text-white/35" : "text-white/90"}`}>
                                {d.label}
                              </span>
                              <SystemBadge system={d.system} />
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] font-mono text-white/25">{fmtShort(d.date)}</span>
                              <span className={`text-[10px] font-medium ${st.text}`}>{st.label}</span>
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] tracking-wider font-medium px-1.5 py-0.5 rounded ${
                              d.type === "deadline"   ? "bg-red-500/10 text-red-400/60" :
                              d.type === "submission" ? "bg-blue-500/10 text-blue-400/60" :
                                                        "bg-white/5 text-white/20"
                            }`}>
                              {d.type.toUpperCase()}
                            </span>
                            <span className="text-white/20">
                              {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </span>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="pb-3 pl-[52px] pr-6">
                            <p className="text-xs text-white/40 leading-relaxed">{d.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Personal Tasks ── */}
        {showTasks && (
          <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.07]">
              <ClipboardList size={13} className="text-[#BF5700]" />
              <span className="text-sm font-semibold text-white">Personal Tasks</span>
              <span className="ml-auto text-[10px] text-white/25">
                {loadingTasks ? "syncing..." : `${tasks.filter(t => t.completed).length}/${tasks.length} done`}
              </span>
            </div>

            <div className="flex-1 divide-y divide-white/[0.04] overflow-y-auto" style={{ maxHeight: 440 }}>
              {tasks.map(task => {
                const days     = daysUntil(task.dueDate);
                const isOver   = !task.completed && days < 0;
                const isUrgent = !task.completed && days >= 0 && days <= 7;
                return (
                  <div key={task.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group ${isOver ? "opacity-60" : ""}`}>
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 mt-0.5 transition-colors ${task.completed ? "text-emerald-400" : "text-white/15 hover:text-white/40"}`}
                    >
                      {task.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug ${task.completed ? "line-through text-white/25" : "text-white/80"}`}>
                        {task.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-mono ${isUrgent ? "text-[#BF5700]" : isOver ? "text-red-400" : "text-white/20"}`}>
                          {fmtShort(task.dueDate)}
                        </span>
                        {isUrgent && <span className="text-[9px] text-[#BF5700] font-medium">{days}d left</span>}
                        {isOver   && <span className="text-[9px] text-red-400 font-medium">{Math.abs(days)}d late</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-white/15 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/[0.07] flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New task..."
                  value={taskLabel}
                  onChange={e => setTaskLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                  className="flex-1 text-sm bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-[#BF5700]/50 transition-colors"
                />
                <input
                  type="date"
                  value={taskDate}
                  onChange={e => setTaskDate(e.target.value)}
                  className="text-[11px] bg-white/[0.05] border border-white/10 rounded-lg px-2 py-2 text-white/45 focus:outline-none focus:border-[#BF5700]/50 transition-colors w-[108px]"
                />
              </div>
              <button
                onClick={addTask}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-[#BF5700]/15 text-[#BF5700] border border-[#BF5700]/25 hover:bg-[#BF5700]/25 transition-colors"
              >
                <Plus size={12} /> Add Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* School Tracker */}
      <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.07]">
          <School size={13} className="text-[#BF5700]" />
          <span className="text-sm font-semibold text-white">School Tracker</span>
          <span className="text-[10px] text-white/25">{schools.length} schools</span>
          <button
            onClick={() => setDialogOpen(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#BF5700] text-white hover:bg-[#BF5700]/80 transition-colors"
          >
            <Plus size={11} /> Add School
          </button>
        </div>

        {/* Stage legend header */}
        <div className="hidden sm:flex items-center gap-1 px-5 py-2.5 border-b border-white/[0.04] bg-white/[0.015]">
          <div className="w-[220px] flex-shrink-0" />
          <div className="flex-1 grid grid-cols-6 gap-1">
            {SCHOOL_STAGES.map(s => (
              <span key={s.key} className="text-[8px] font-semibold tracking-wider uppercase text-center text-white/20">{s.label}</span>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {loadingSchools && <div className="px-5 py-4 text-xs text-white/35">Loading school tracker...</div>}
          {!loadingSchools && schools.length === 0 && (
            <div className="px-5 py-6 text-sm text-white/35">No school applications found in Supabase.</div>
          )}
          {schools.map(school => {
            const { pct } = schoolProgress(school);
            const decCfg =
              school.decision === "accepted"   ? { text: "text-emerald-400",  bg: "bg-emerald-500/15", border: "border-emerald-500/25" } :
              school.decision === "waitlisted" ? { text: "text-yellow-400",   bg: "bg-yellow-500/15",  border: "border-yellow-500/25"  } :
              school.decision === "rejected"   ? { text: "text-red-400",      bg: "bg-red-500/10",     border: "border-red-500/20"     } : null;

            const barColor =
              school.decision === "accepted"   ? "bg-emerald-500" :
              school.decision === "rejected"   ? "bg-red-400/50" :
              school.decision === "waitlisted" ? "bg-yellow-400" : "bg-[#BF5700]";

            return (
              <div key={school.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                {/* School identity */}
                <div className="flex items-center gap-3 w-full sm:w-[220px] flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-white/50 tracking-tight">{school.abbr}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="text-[13px] font-medium text-white/90 truncate">{school.name}</span>
                      {decCfg && (
                        <span className={`text-[8px] font-semibold tracking-wider px-1.5 py-0.5 rounded border capitalize ${decCfg.text} ${decCfg.bg} ${decCfg.border}`}>
                          {school.decision}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-medium ${school.system === "TMDSAS" ? "text-[#BF5700]/60" : "text-blue-400/60"}`}>
                        {school.system}
                      </span>
                      <span className="text-[9px] text-white/20">{pct}% complete</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar + stage dots */}
                <div className="flex-1">
                  <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden mb-2.5">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {SCHOOL_STAGES.map(s => {
                      const val = (school as unknown as Record<string, unknown>)[s.key];
                      const filled = Boolean(val);
                      const dateStr = typeof val === "string" ? val : null;
                      return (
                        <div key={s.key} className="flex flex-col items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${filled ? barColor : "bg-white/[0.10]"}`} />
                          {dateStr && dateStr.includes("-") && (
                            <span className="text-[7px] text-white/20 font-mono hidden lg:block">{fmtShort(dateStr)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add School Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add School Deadline">
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <LabeledInput
                label="School Name"
                placeholder="e.g. McGovern Medical School"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              />
            </div>
            <LabeledInput
              label="Abbreviation"
              placeholder="MCGOV"
              value={draft.abbr}
              onChange={e => setDraft(d => ({ ...d, abbr: e.target.value }))}
            />
            <div>
              <label className="text-[9px] font-medium tracking-[0.14em] uppercase text-white/35 block mb-1">System</label>
              <select
                value={draft.system}
                onChange={e => setDraft(d => ({ ...d, system: e.target.value as "AMCAS" | "TMDSAS" }))}
                className="w-full text-sm bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BF5700]/50 transition-colors"
              >
                <option value="TMDSAS">TMDSAS</option>
                <option value="AMCAS">AMCAS</option>
              </select>
            </div>
          </div>

          <div className="border-t border-white/[0.07] pt-3">
            <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-white/25 mb-2.5">Track Dates (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["applied",            "Applied"],
                ["secondaryReceived",  "Sec. Received"],
                ["secondarySubmitted", "Sec. Submitted"],
                ["interviewInvite",    "Interview Invite"],
                ["interviewDate",      "Interview Date"],
              ] as const).map(([key, lbl]) => (
                <div key={key}>
                  <label className="text-[9px] text-white/30 font-medium block mb-0.5">{lbl}</label>
                  <input
                    type="date"
                    value={(draft as Record<string, string>)[key]}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                    className="w-full text-xs bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white/60 focus:outline-none focus:border-[#BF5700]/50 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="text-[9px] text-white/30 font-medium block mb-0.5">Decision</label>
                <select
                  value={draft.decision ?? ""}
                  onChange={e => setDraft(d => ({ ...d, decision: e.target.value as Decision | "" }))}
                  className="w-full text-xs bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white/60 focus:outline-none focus:border-[#BF5700]/50 transition-colors"
                >
                  <option value="">— none —</option>
                  <option value="accepted">Accepted</option>
                  <option value="waitlisted">Waitlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={addSchool}
            className="mt-1 w-full py-2.5 rounded-lg text-sm font-semibold bg-[#BF5700] text-white hover:bg-[#BF5700]/80 transition-colors"
          >
            Add School
          </button>
        </div>
      </Dialog>
    </div>
  );
}
