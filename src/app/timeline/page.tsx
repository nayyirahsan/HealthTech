"use client";

import { useState, useMemo } from "react";
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

// ── Types ─────────────────────────────────────────────────────────────────────

type System = "AMCAS" | "TMDSAS" | "Both";
type FilterMode = "All" | "AMCAS" | "TMDSAS" | "Personal";
type Decision = "accepted" | "waitlisted" | "rejected" | null;

interface MasterDeadline {
  id: string;
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

// ── Mock Data — 2025–26 Cycle ─────────────────────────────────────────────────

const TODAY = new Date("2026-04-14");

const MASTER_DEADLINES: MasterDeadline[] = [
  { id: "amcas-opens",         label: "AMCAS Application Opens",            date: "2025-05-01", system: "AMCAS",  type: "milestone",  description: "Portal opens; begin filling out primary application.",              completed: true  },
  { id: "tmdsas-opens",        label: "TMDSAS Application Opens",           date: "2025-05-01", system: "TMDSAS", type: "milestone",  description: "Texas medical school portal opens.",                                completed: true  },
  { id: "lor-request",         label: "Request Letters of Recommendation",  date: "2025-05-15", system: "Both",   type: "milestone",  description: "Contact committee chair and individual letter writers.",           completed: true  },
  { id: "amcas-first-submit",  label: "AMCAS First Day to Submit",          date: "2025-06-03", system: "AMCAS",  type: "submission", description: "Earliest possible AMCAS primary submission date.",                  completed: true  },
  { id: "secondary-season",    label: "Secondary Essay Season Begins",      date: "2025-07-01", system: "Both",   type: "milestone",  description: "Secondary invitations begin rolling in from verified schools.",     completed: true  },
  { id: "tmdsas-first-submit", label: "TMDSAS First Day to Submit",         date: "2025-07-15", system: "TMDSAS", type: "submission", description: "Begin transmitting completed TX primary applications.",              completed: true  },
  { id: "amcas-edp",           label: "AMCAS Early Decision Deadline",      date: "2025-08-01", system: "AMCAS",  type: "deadline",   description: "Binding early decision program (EDP) cutoff date.",                 completed: true  },
  { id: "mcat-cutoff",         label: "Last MCAT for Rolling Schools",      date: "2025-09-06", system: "Both",   type: "milestone",  description: "Scores from this date arrive in time for most rolling programs.",   completed: true  },
  { id: "tmdsas-lor",          label: "TMDSAS Letters of Rec Deadline",     date: "2025-09-15", system: "TMDSAS", type: "deadline",   description: "All reference letters must be received by TMDSAS.",                 completed: true  },
  { id: "tmdsas-deadline",     label: "TMDSAS Application Deadline",        date: "2025-10-01", system: "TMDSAS", type: "deadline",   description: "Hard deadline for all Texas MD programs — no exceptions.",          completed: true  },
  { id: "interview-season",    label: "Interview Season Opens",             date: "2025-10-01", system: "Both",   type: "milestone",  description: "Medical school interviews begin (October through March).",           completed: true  },
  { id: "amcas-rolling",       label: "AMCAS Rolling Peak Deadline",        date: "2025-10-15", system: "AMCAS",  type: "deadline",   description: "Most competitive programs stop reviewing new applications.",         completed: true  },
  { id: "amcas-regular",       label: "AMCAS Regular Deadline (Most)",      date: "2025-11-15", system: "AMCAS",  type: "deadline",   description: "Hard deadline for the majority of MD programs.",                    completed: true  },
  { id: "amcas-late",          label: "AMCAS Late Deadline (Late Schools)", date: "2026-01-15", system: "AMCAS",  type: "deadline",   description: "Final cutoff for schools accepting late applications.",              completed: true  },
  { id: "hold-deadline",       label: "AAMC Multiple Acceptance Hold",      date: "2026-04-15", system: "AMCAS",  type: "deadline",   description: "Must narrow to ≤2 acceptances — programs may rescind extras.",      completed: false },
  { id: "acceptance-day",      label: "Acceptance Day — Final Decision",    date: "2026-05-15", system: "Both",   type: "milestone",  description: "Deposit due; commit to your medical school of choice.",             completed: false },
  { id: "cycle-ends",          label: "Application Cycle Ends",             date: "2026-06-30", system: "Both",   type: "milestone",  description: "All offer decisions finalized. AAMC / TMDSAS cycle closes.",        completed: false },
];

const INITIAL_TASKS: PersonalTask[] = [
  { id: "pt1", label: "Finalize personal statement draft",           dueDate: "2025-05-20", completed: true  },
  { id: "pt2", label: "Request committee letter from pre-health",    dueDate: "2025-05-10", completed: true  },
  { id: "pt3", label: "Complete all TMDSAS essays",                  dueDate: "2025-07-01", completed: true  },
  { id: "pt4", label: "Submit 5 secondary essays",                   dueDate: "2025-08-15", completed: true  },
  { id: "pt5", label: "Prepare for UT Southwestern MMI",             dueDate: "2025-11-08", completed: true  },
  { id: "pt6", label: "Send thank-you notes to interviewers",        dueDate: "2025-11-20", completed: false },
  { id: "pt7", label: "Send LOI to Baylor COM (on waitlist)",        dueDate: "2026-02-01", completed: false },
  { id: "pt8", label: "Compare financial aid packages",              dueDate: "2026-04-30", completed: false },
  { id: "pt9", label: "Finalize school decision before May 15",      dueDate: "2026-05-14", completed: false },
];

const INITIAL_SCHOOLS: SchoolEntry[] = [
  { id: "s1", name: "UT Southwestern",           abbr: "UTSW", system: "TMDSAS", applied: "2025-07-15", secondaryReceived: "2025-08-10", secondarySubmitted: "2025-08-20", interviewInvite: "2025-10-05", interviewDate: "2025-11-12", decision: "accepted"   },
  { id: "s2", name: "Baylor COM",                abbr: "BCM",  system: "TMDSAS", applied: "2025-07-15", secondaryReceived: "2025-08-08", secondarySubmitted: "2025-08-22", interviewInvite: "2025-10-15", interviewDate: "2025-12-03", decision: "waitlisted" },
  { id: "s3", name: "Texas A&M COM",             abbr: "TAMU", system: "TMDSAS", applied: "2025-07-15", secondaryReceived: "2025-08-15", secondarySubmitted: "2025-09-01", interviewInvite: null,          interviewDate: null,          decision: "rejected"   },
  { id: "s4", name: "UT Health Houston",         abbr: "UTH",  system: "TMDSAS", applied: "2025-07-15", secondaryReceived: "2025-08-20", secondarySubmitted: "2025-09-05", interviewInvite: "2025-10-25", interviewDate: "2025-12-08", decision: "accepted"   },
  { id: "s5", name: "Mayo Clinic Alix SOM",      abbr: "MAYO", system: "AMCAS",  applied: "2025-06-10", secondaryReceived: "2025-07-05", secondarySubmitted: "2025-07-20", interviewInvite: null,          interviewDate: null,          decision: "rejected"   },
  { id: "s6", name: "Tulane School of Medicine", abbr: "TULU", system: "AMCAS",  applied: "2025-06-10", secondaryReceived: "2025-07-12", secondarySubmitted: "2025-08-01", interviewInvite: "2025-10-30", interviewDate: "2026-01-15", decision: null         },
];

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
  const [filter, setFilter]         = useState<FilterMode>("All");
  const [tasks, setTasks]           = useState<PersonalTask[]>(INITIAL_TASKS);
  const [schools, setSchools]       = useState<SchoolEntry[]>(INITIAL_SCHOOLS);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [taskLabel, setTaskLabel]   = useState("");
  const [taskDate, setTaskDate]     = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [draft, setDraft] = useState({
    name: "", abbr: "", system: "TMDSAS" as "AMCAS" | "TMDSAS",
    applied: "", secondaryReceived: "", secondarySubmitted: "",
    interviewInvite: "", interviewDate: "", decision: "" as Decision | "",
  });

  // Filtered & grouped timeline
  const filtered = useMemo(() => {
    if (filter === "Personal") return [];
    return MASTER_DEADLINES.filter(d => {
      if (filter === "All") return true;
      return d.system === filter || d.system === "Both";
    });
  }, [filter]);

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
    if (!draft.name.trim()) return;
    setSchools(ss => [...ss, {
      id: uid(),
      name: draft.name.trim(),
      abbr: draft.abbr.trim() || draft.name.slice(0, 4).toUpperCase(),
      system: draft.system,
      applied:            draft.applied            || null,
      secondaryReceived:  draft.secondaryReceived  || null,
      secondarySubmitted: draft.secondarySubmitted || null,
      interviewInvite:    draft.interviewInvite    || null,
      interviewDate:      draft.interviewDate      || null,
      decision:           (draft.decision as Decision) || null,
    }]);
    setDialogOpen(false);
    setDraft({ name: "", abbr: "", system: "TMDSAS", applied: "", secondaryReceived: "", secondarySubmitted: "", interviewInvite: "", interviewDate: "", decision: "" });
  }

  const completedCount = MASTER_DEADLINES.filter(d => d.completed).length;
  const showTimeline   = filter !== "Personal";
  const showTasks      = filter === "All" || filter === "Personal";

  const COUNTDOWN = [
    { label: "AAMC Acceptance Hold", date: "2026-04-15" },
    { label: "Acceptance Day",        date: "2026-05-15" },
    { label: "Cycle Ends",            date: "2026-06-30" },
  ];

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
        {COUNTDOWN.map(c => <CountdownCard key={c.date} {...c} />)}

        {/* Completion meter */}
        <div className="flex-1 min-w-[130px] rounded-xl border bg-white/[0.04] border-white/10 p-4 flex flex-col gap-1.5">
          <span className="text-[9px] font-medium tracking-[0.14em] uppercase text-white/35">Deadlines Hit</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[2rem] font-bold leading-none text-emerald-400">{completedCount}</span>
            <span className="text-xs text-white/30">/ {MASTER_DEADLINES.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round((completedCount / MASTER_DEADLINES.length) * 100)}%` }}
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
                        <button
                          onClick={() => setExpanded(isOpen ? null : d.id)}
                          className="w-full text-left flex items-start gap-3.5 px-5 py-3 hover:bg-white/[0.025] transition-colors"
                        >
                          {/* Dot */}
                          <div className="relative flex-shrink-0 z-10 mt-[3px]">
                            <div className={`w-3 h-3 rounded-full ring-2 ${st.dot} ${st.ring}`} />
                          </div>

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
                        </button>

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
                {tasks.filter(t => t.completed).length}/{tasks.length} done
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
