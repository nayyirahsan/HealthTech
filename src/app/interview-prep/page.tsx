"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  RotateCcw,
  ChevronRight,
  CheckSquare,
  Square,
  Clock,
  BookOpen,
  Save,
  Bell,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Format = "MMI" | "Traditional" | "Panel";

interface Question {
  id:     number;
  text:   string;
  format: Format;
  school: string;
  tip:    string;
}

// ── Question bank ─────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    format: "MMI",
    school: "UT Southwestern",
    text: "A close friend tells you they have been falsifying research data for their thesis. They ask you not to report them. What do you do?",
    tip: "MMI ethical scenarios reward structured thinking. State the tension clearly, explore all parties affected, then give a decisive answer with your reasoning. Don't sit on the fence.",
  },
  {
    id: 2,
    format: "MMI",
    school: "Baylor COM",
    text: "You are a physician and a patient refuses a blood transfusion necessary to save their life due to religious beliefs. How do you respond?",
    tip: "Patient autonomy vs. beneficence. Acknowledge the conflict, respect autonomy, document refusal, explore alternatives, and consider involving an ethics board. Show empathy throughout.",
  },
  {
    id: 3,
    format: "MMI",
    school: "Texas A&M COM",
    text: "Healthcare costs in the US are the highest in the world yet outcomes lag behind peer nations. What systemic changes would you prioritize as a future physician?",
    tip: "Demonstrates healthcare policy knowledge. Focus on 2-3 concrete areas (primary care access, preventive care, administrative waste). Avoid partisan framing — stay evidence-based.",
  },
  {
    id: 4,
    format: "MMI",
    school: "UT Health Houston",
    text: "You witness a fellow medical student cheating on an exam. The student is your close friend and studying partner. Walk us through your thought process.",
    tip: "Academic integrity scenarios test your values under social pressure. Be honest about the difficulty, but demonstrate that integrity wins. Mention talking to the friend first before escalating.",
  },
  {
    id: 5,
    format: "MMI",
    school: "Mayo Clinic",
    text: "A terminally ill patient asks you to help them end their life. Medical aid in dying is not legal in your state. How do you respond?",
    tip: "Know the distinction between palliative care, hospice, and MAID. Demonstrate compassion and awareness of legal limits. Focus on comfort measures and patient dignity.",
  },
  {
    id: 6,
    format: "Traditional",
    school: "UT Southwestern",
    text: "Tell me about yourself and why you want to be a physician.",
    tip: "This is your personal narrative. Lead with a specific moment, not a generic statement. Connect your background to medicine logically. Keep it under 2 minutes — this opens conversation, it doesn't close it.",
  },
  {
    id: 7,
    format: "Traditional",
    school: "Baylor COM",
    text: "Describe a time you made a significant mistake. What did you learn from it?",
    tip: "Avoid trivial mistakes and avoid catastrophic ones. Pick something real with genuine growth. The reflection is more important than the mistake itself — show insight and behavior change.",
  },
  {
    id: 8,
    format: "Traditional",
    school: "Texas A&M COM",
    text: "Why do you want to come to Texas A&M specifically? What drew you to our program?",
    tip: "Do your homework. Mention specific faculty, programs, or community health initiatives. Generic answers are obvious. Authenticity matters — connect something real about your goals to their specific strengths.",
  },
  {
    id: 9,
    format: "Traditional",
    school: "UT Health Houston",
    text: "What is your greatest weakness, and what are you actively doing to address it?",
    tip: "Pick a real weakness — not a strength disguised as one. Show self-awareness and a concrete improvement plan. Interviewers see through 'I work too hard' immediately.",
  },
  {
    id: 10,
    format: "Traditional",
    school: "Mayo Clinic",
    text: "Where do you see yourself in 15 years? How does Mayo fit into that vision?",
    tip: "Be specific but flexible. Mention a specialty interest if you have one, or describe the type of practice (academic vs. community, primary care vs. specialist). Tie it to Mayo's strengths.",
  },
  {
    id: 11,
    format: "Panel",
    school: "UT Southwestern",
    text: "Our panel would like to understand how you handle conflict. Describe a time you disagreed with a supervisor and how you handled it.",
    tip: "Panel interviews reward composure when multiple people are watching. Pick a conflict with professional stakes. Show that you voiced your concern respectfully through proper channels, then accepted the decision.",
  },
  {
    id: 12,
    format: "Panel",
    school: "Texas A&M COM",
    text: "Each panelist will ask one follow-up question about your most meaningful clinical experience. Please describe that experience now.",
    tip: "Choose a specific patient interaction, not a general summary. Use the STAR format. Panels will probe deeply — be ready to discuss what you observed, what you felt, and what you'd do differently.",
  },
  {
    id: 13,
    format: "Panel",
    school: "UT Health Houston",
    text: "How would you contribute to diversity and inclusion in our medical school community?",
    tip: "This isn't just about your identity — it's about action. Describe specific things you have done or would do. Mention mentorship, outreach, and cultural competency in clinical care.",
  },
  {
    id: 14,
    format: "MMI",
    school: "Baylor COM",
    text: "You are a first-year resident. You discover that an attending physician you respect is prescribing unnecessary opioids to patients. What do you do?",
    tip: "This tests professional hierarchy vs. patient safety. Patient safety always wins. Know the reporting pathway (department chair, patient safety officer, state medical board as escalation). Demonstrate courage.",
  },
  {
    id: 15,
    format: "Traditional",
    school: "Mayo Clinic",
    text: "Tell me about a time you worked in a team that was struggling. What was your role in turning it around?",
    tip: "Demonstrate leadership without needing the formal title. Focus on listening, identifying the root cause of dysfunction, and facilitating rather than dominating. Show results.",
  },
];

// ── Config ────────────────────────────────────────────────────────────────────

const FORMAT_DURATION: Record<Format, number> = {
  MMI:         8 * 60,
  Traditional: 15 * 60,
  Panel:       15 * 60,
};

const FORMAT_CFG: Record<Format, { color: string; bg: string; border: string; label: string }> = {
  MMI:         { color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/25",  label: "8 min" },
  Traditional: { color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20",     label: "15 min" },
  Panel:       { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   label: "15 min" },
};

const ALL_SCHOOLS = Array.from(new Set(QUESTIONS.map((q) => q.school))).sort();
const ALL_FORMATS: Format[] = ["MMI", "Traditional", "Panel"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// SVG progress ring
function ProgressRing({ progress, size = 160, stroke = 6, color = "#BF5700", warn = false }: {
  progress: number; size?: number; stroke?: number; color?: string; warn?: boolean;
}) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * (1 - progress);
  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      {/* Fill */}
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={warn ? "#ef4444" : color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
      />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InterviewPrepPage() {
  // Filters
  const [selectedSchools,  setSelectedSchools]  = useState<Set<string>>(new Set(ALL_SCHOOLS));
  const [selectedFormats,  setSelectedFormats]  = useState<Set<Format>>(new Set(ALL_FORMATS));

  // Question state
  const [filteredQ,    setFilteredQ]    = useState<Question[]>(QUESTIONS);
  const [qIndex,       setQIndex]       = useState(0);
  const [seenIds,      setSeenIds]      = useState<Set<number>>(new Set());

  // Timer state
  const [timerState,   setTimerState]   = useState<"idle" | "running" | "done">("idle");
  const [secondsLeft,  setSecondsLeft]  = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Notes state
  const [note,      setNote]      = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [savedNotes, setSavedNotes] = useState<Record<number, string>>({});

  // Recompute filtered list whenever filters change
  useEffect(() => {
    const f = QUESTIONS.filter(
      (q) => selectedSchools.has(q.school) && selectedFormats.has(q.format)
    );
    setFilteredQ(f.length > 0 ? f : QUESTIONS);
    setQIndex(0);
    resetTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchools, selectedFormats]);

  const currentQ = filteredQ[qIndex] ?? QUESTIONS[0];

  // Timer logic
  function startTimer() {
    const dur = FORMAT_DURATION[currentQ.format];
    setTotalSeconds(dur);
    setSecondsLeft(dur);
    setTimerState("running");
  }

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("idle");
    setSecondsLeft(0);
    setTotalSeconds(0);
  }, []);

  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerState("done");
            playAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  function playAlert() {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      // Two gentle beeps
      [0, 0.4].forEach((delay) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type      = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.4);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.5);
      });
    } catch { /* audio not available */ }
  }

  function nextQuestion() {
    setSeenIds((prev) => new Set(Array.from(prev).concat(currentQ.id)));
    const unseen = filteredQ.filter((q) => !seenIds.has(q.id) && q.id !== currentQ.id);
    if (unseen.length > 0) {
      const next = unseen[Math.floor(Math.random() * unseen.length)];
      setQIndex(filteredQ.indexOf(next));
    } else {
      // All seen — reset and pick random
      setSeenIds(new Set());
      const next = filteredQ[Math.floor(Math.random() * filteredQ.length)];
      setQIndex(filteredQ.indexOf(next));
    }
    resetTimer();
    setNote("");
    setNoteSaved(false);
  }

  function saveNote() {
    setSavedNotes((prev) => ({ ...prev, [currentQ.id]: note }));
    setNoteSaved(true);
  }

  function toggleSchool(school: string) {
    setSelectedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(school)) { next.delete(school); } else { next.add(school); }
      return next.size > 0 ? next : prev;
    });
  }

  function toggleFormat(fmt: Format) {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(fmt)) { next.delete(fmt); } else { next.add(fmt); }
      return next.size > 0 ? next : prev;
    });
  }

  const progress   = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const isWarning  = timerState === "running" && secondsLeft <= 60;
  const cfg        = FORMAT_CFG[currentQ.format];
  const prevNote   = savedNotes[currentQ.id] ?? "";

  return (
    <div className="min-h-full bg-[#0F172A] flex overflow-hidden" style={{ height: "calc(100vh - 3rem)" }}>

      {/* ── Left sidebar ── */}
      <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col overflow-y-auto">

        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-3 border-b border-white/10">
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/30">
            Filters
          </span>
        </div>

        <div className="p-4 space-y-6 flex-1">
          {/* Format filter */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/25 mb-2">
              Format
            </p>
            <div className="flex flex-col gap-1.5">
              {ALL_FORMATS.map((fmt) => {
                const active = selectedFormats.has(fmt);
                const fcfg   = FORMAT_CFG[fmt];
                return (
                  <button
                    key={fmt}
                    onClick={() => toggleFormat(fmt)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      active
                        ? `${fcfg.color} ${fcfg.bg} ${fcfg.border}`
                        : "text-white/30 bg-white/[0.03] border-white/[0.07] hover:text-white/50"
                    }`}
                  >
                    <span>{fmt}</span>
                    <span className={`text-[10px] font-mono ${active ? fcfg.color : "text-white/20"}`}>
                      {fcfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* School filter */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/25 mb-2">
              Schools
            </p>
            <div className="flex flex-col gap-1">
              {ALL_SCHOOLS.map((school) => {
                const checked = selectedSchools.has(school);
                return (
                  <button
                    key={school}
                    onClick={() => toggleSchool(school)}
                    className="flex items-center gap-2 py-1.5 text-left group"
                  >
                    {checked
                      ? <CheckSquare size={13} className="text-[#BF5700] shrink-0" />
                      : <Square      size={13} className="text-white/20 group-hover:text-white/40 shrink-0 transition-colors" />}
                    <span className={`text-xs leading-snug ${checked ? "text-white/70" : "text-white/25 group-hover:text-white/45"} transition-colors`}>
                      {school}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question count */}
          <div className="pt-2 border-t border-white/[0.07]">
            <p className="text-[11px] text-white/25 text-center font-mono">
              {filteredQ.length} question{filteredQ.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-start px-8 py-8 max-w-3xl mx-auto w-full">

          {/* Question card */}
          <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-8 space-y-6">

            {/* Card meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  {currentQ.format}
                </span>
                <span className="text-xs text-white/30">{currentQ.school}</span>
              </div>
              <span className="text-[11px] text-white/20 font-mono">
                {qIndex + 1} / {filteredQ.length}
              </span>
            </div>

            {/* Question text */}
            <div className="py-4">
              <p className="text-xl font-semibold text-white leading-relaxed text-center">
                {currentQ.text}
              </p>
            </div>

            {/* Tip */}
            <div className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
              <BookOpen size={13} className="text-[#BF5700] shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">{currentQ.tip}</p>
            </div>
          </div>

          {/* ── Timer section ── */}
          <div className="mt-8 flex flex-col items-center gap-6 w-full">

            {timerState === "idle" && (
              <button
                onClick={startTimer}
                className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-[#BF5700] hover:bg-[#D4620A] text-white font-semibold text-sm transition-colors shadow-lg shadow-[#BF5700]/20"
              >
                <Play size={16} />
                Start Timer
                <span className="font-mono text-[#fff]/70 text-xs ml-1">
                  ({currentQ.format === "MMI" ? "8:00" : "15:00"})
                </span>
              </button>
            )}

            {(timerState === "running" || timerState === "done") && (
              <div className="flex flex-col items-center gap-4">
                {/* Progress ring + countdown */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <ProgressRing progress={progress} size={160} stroke={5} warn={isWarning} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {timerState === "done" ? (
                      <>
                        <Bell size={22} className="text-[#BF5700] mb-1" />
                        <span className="text-sm font-semibold text-white/60">Time&apos;s up</span>
                      </>
                    ) : (
                      <>
                        <span
                          className={`font-mono text-3xl font-bold tabular-nums ${
                            isWarning ? "text-red-400" : "text-white"
                          }`}
                        >
                          {formatTime(secondsLeft)}
                        </span>
                        {isWarning && (
                          <span className="text-[11px] text-red-400/70 mt-0.5">1 min left</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Timer controls */}
                <div className="flex gap-3">
                  <button
                    onClick={resetTimer}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                  {timerState === "running" && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs text-white/30">
                      <Clock size={12} /> Running
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Self-reflection — appears after timer done */}
            {timerState === "done" && (
              <div className="w-full space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium tracking-[0.1em] uppercase text-white/35">
                    Self-Reflection Notes
                  </p>
                  {prevNote && (
                    <span className="text-[11px] text-white/25">Previous note saved</span>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={note}
                  onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }}
                  placeholder="What went well? What would you say differently? Any key points you missed…"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/75 placeholder:text-white/20 resize-none outline-none focus:border-[#BF5700]/40 transition-colors leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={saveNote}
                    disabled={!note.trim() || noteSaved}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#BF5700]/15 border border-[#BF5700]/25 text-xs font-medium text-[#BF5700] hover:bg-[#BF5700]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save size={12} />
                    {noteSaved ? "Saved ✓" : "Save Note"}
                  </button>
                  {prevNote && (
                    <div className="text-[11px] text-white/25 max-w-xs text-right line-clamp-1">
                      Previous: &ldquo;{prevNote.slice(0, 60)}{prevNote.length > 60 ? "…" : ""}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next question */}
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:border-[#BF5700]/30 hover:bg-[#BF5700]/[0.07] transition-colors mt-2"
            >
              Next Question <ChevronRight size={14} />
            </button>
          </div>

          {/* Progress dots */}
          <div className="mt-8 flex gap-1.5 flex-wrap justify-center max-w-xs">
            {filteredQ.map((q, i) => (
              <button
                key={q.id}
                onClick={() => { setQIndex(i); resetTimer(); setNote(""); setNoteSaved(false); }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === qIndex
                    ? "bg-[#BF5700]"
                    : seenIds.has(q.id)
                    ? "bg-white/30"
                    : "bg-white/10 hover:bg-white/25"
                }`}
                title={q.school}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-white/20 font-mono">
            {seenIds.size} seen · {filteredQ.length - seenIds.size} remaining
          </p>

        </div>
      </div>
    </div>
  );
}
