"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { ReactNode } from "react"
import { Crimson_Pro, Space_Mono } from "next/font/google"
import {
  Camera,
  Check,
  Edit3,
  X,
  AlertCircle,
  Loader2,
  User,
  Hash,
  GraduationCap,
  Calendar,
  Stethoscope,
  Microscope,
  Heart,
  Eye,
  Award,
} from "lucide-react"
import { userProfile, utMedian } from "@/lib/mock-data"

// ─── Fonts ──────────────────────────────────────────────────────────────────

const crimson = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
})

// ─── Types ───────────────────────────────────────────────────────────────────

type AppStatus = "pre-app" | "applied" | "interviewing" | "accepted"

interface Profile {
  avatar: string | null
  name: string
  eid: string
  gradYear: string
  appCycle: string
  gpa: { overall: number; science: number }
  mcat: { total: number; cp: number; cars: number; bb: number; ps: number }
  hours: {
    clinical: number
    research: number
    volunteering: number
    shadowing: number
    leadership: number
  }
  personalStatement: string
  appStatus: AppStatus
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK: Profile = {
  avatar: null,
  name: userProfile.fullName,
  eid: userProfile.eid,
  gradYear: String(userProfile.graduationYear),
  appCycle: userProfile.appCycle,
  gpa: { overall: userProfile.gpa, science: userProfile.scienceGpa },
  mcat: {
    total: userProfile.mcat,
    cp: userProfile.mcatBreakdown.cp,
    cars: userProfile.mcatBreakdown.cars,
    bb: userProfile.mcatBreakdown.bb,
    ps: userProfile.mcatBreakdown.ps,
  },
  hours: {
    clinical: userProfile.clinicalHours,
    research: userProfile.researchHours,
    volunteering: userProfile.volunteerHours,
    shadowing: userProfile.shadowingHours,
    leadership: userProfile.leadershipHours,
  },
  personalStatement: `Medicine called to me not from sterile hospital hallways, but from my grandmother's kitchen in Lagos — where she mixed herbs with prayer and fed neighbors who couldn't reach the clinic across town. That early exposure taught me something no textbook could: that healing is fundamentally an act of presence.

As a first-generation pre-med student at UT Austin, I've spent four years translating that lesson into practice. Three hundred hours in the cardiac care unit at Dell Seton Medical Center taught me to read the room before the chart. The patient in Bed 4 who flinched every time nurses mentioned "the procedure" didn't need more clinical information — she needed someone to slow down and sit with her.

My work in Dr. Patel's neuropharmacology lab sharpened a different kind of attention: the discipline of uncertainty. Science demands you hold contradictory datasets with equal seriousness until evidence resolves the tension. Medicine, I've learned, asks for exactly the same thing.

I am applying to medical school to become a physician-scientist who builds bridges — between bench and bedside, between evidence and empathy, between institution and the communities it too often overlooks. The work is long. I have been preparing for it my entire life.`,
  appStatus: "interviewing",
}

// UT HPO median for admitted applicants (kept consistent with dashboard/ut-benchmarks)
const HPO_MEDIANS = {
  clinical: utMedian.clinicalHours,
  research: utMedian.researchHours,
  volunteering: utMedian.volunteerHours,
  shadowing: utMedian.shadowingHours,
  leadership: utMedian.leadershipHours,
}

const HOURS_CFG = [
  { key: "clinical" as const, label: "Clinical", Icon: Stethoscope, color: "#BF5700" },
  { key: "research" as const, label: "Research", Icon: Microscope, color: "#38BDF8" },
  { key: "volunteering" as const, label: "Volunteering", Icon: Heart, color: "#34D399" },
  { key: "shadowing" as const, label: "Shadowing", Icon: Eye, color: "#A78BFA" },
  { key: "leadership" as const, label: "Leadership", Icon: Award, color: "#FBBF24" },
]

const STATUS_STEPS: { key: AppStatus; label: string }[] = [
  { key: "pre-app", label: "Pre-App" },
  { key: "applied", label: "Applied" },
  { key: "interviewing", label: "Interviewing" },
  { key: "accepted", label: "Accepted" },
]

const MCAT_SECTIONS = [
  { key: "cp" as const, label: "C/P", name: "Chem / Phys" },
  { key: "cars" as const, label: "CARS", name: "Critical Analysis" },
  { key: "bb" as const, label: "B/B", name: "Bio / Biochem" },
  { key: "ps" as const, label: "P/S", name: "Psych / Soc" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const wc = (t: string) => (t.trim() === "" ? 0 : t.trim().split(/\s+/).length)

const mcatPct = (s: number) => Math.max(0, Math.min(100, ((s - 118) / 14) * 100))

function computeCompleteness(p: Profile) {
  const checks = [
    { l: "Avatar photo", ok: !!p.avatar },
    { l: "Full name", ok: p.name.trim() !== "" },
    { l: "UT EID", ok: p.eid.trim() !== "" },
    { l: "Graduation year", ok: p.gradYear.trim() !== "" },
    { l: "Application cycle", ok: p.appCycle.trim() !== "" },
    { l: "Overall GPA", ok: p.gpa.overall > 0 },
    { l: "Science GPA", ok: p.gpa.science > 0 },
    { l: "MCAT score", ok: p.mcat.total > 0 },
    { l: "Clinical hours", ok: p.hours.clinical > 0 },
    { l: "Research hours", ok: p.hours.research > 0 },
    { l: "Personal statement (100+ words)", ok: wc(p.personalStatement) >= 100 },
    { l: "Application status", ok: p.appStatus !== "pre-app" },
  ]
  return {
    score: Math.round((checks.filter((c) => c.ok).length / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.l),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RingChart({ score }: { score: number }) {
  const size = 148
  const sw = 10
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? "#34D399" : score >= 50 ? "#BF5700" : "#F87171"
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E293B" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center pointer-events-none select-none">
        <span
          className="text-3xl font-bold leading-none"
          style={{ fontFamily: "var(--font-space-mono), monospace", color }}
        >
          {score}
        </span>
        <span className="text-[9px] uppercase tracking-[0.14em] text-slate-500 mt-1">% done</span>
      </div>
    </div>
  )
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6 ${className}`}
    >
      {children}
    </section>
  )
}

function SectionHead({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span
        className="block h-[18px] w-[3px] flex-shrink-0 rounded-full"
        style={{ background: "#BF5700" }}
      />
      <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/40">
        {children}
      </h2>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(MOCK)
  const [editField, setEditField] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [mcatEdit, setMcatEdit] = useState<keyof Profile["mcat"] | null>(null)
  const [mcatDraft, setMcatDraft] = useState("")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { score, missing } = computeCompleteness(profile)
  const words = wc(profile.personalStatement)

  const triggerSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    setSaveState("saving")
    saveTimerRef.current = setTimeout(() => {
      setSaveState("saved")
      resetTimerRef.current = setTimeout(() => setSaveState("idle"), 2200)
    }, 1400)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  const startEdit = (field: string, value: string) => {
    setEditField(field)
    setDrafts((d) => ({ ...d, [field]: value }))
  }

  const commitEdit = (field: keyof Profile) => {
    setProfile((p) => ({ ...p, [field]: drafts[field] ?? "" }))
    setEditField(null)
  }

  const cancelEdit = () => setEditField(null)

  const saveMcat = () => {
    if (!mcatEdit || mcatEdit === "total") return
    const fallback = profile.mcat[mcatEdit]
    const val = Math.min(132, Math.max(118, parseInt(mcatDraft) || (fallback as number)))
    const updated = { ...profile.mcat, [mcatEdit]: val }
    updated.total = updated.cp + updated.cars + updated.bb + updated.ps
    setProfile((p) => ({ ...p, mcat: updated }))
    setMcatEdit(null)
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfile((p) => ({ ...p, avatar: URL.createObjectURL(file) }))
  }

  const statusIdx = STATUS_STEPS.findIndex((s) => s.key === profile.appStatus)

  return (
    <div className={`${crimson.variable} ${spaceMono.variable}`}>
      <div
        className="min-h-screen"
        style={{
          background:
            "radial-gradient(ellipse at 60% 0%, rgba(191,87,0,0.07) 0%, transparent 50%), #0F172A",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 py-8 space-y-5">

          {/* ═══════════════════════════════════════════════════
              HERO
          ══════════════════════════════════════════════════════ */}
          <Card className="relative overflow-hidden">
            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 20% 60%, rgba(191,87,0,0.10) 0%, transparent 60%)",
              }}
            />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-7">
              {/* Avatar */}
              <div
                className="relative flex-shrink-0 group cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <div
                  className="w-[88px] h-[88px] rounded-[18px] overflow-hidden flex items-center justify-center border"
                  style={{ borderColor: "rgba(191,87,0,0.30)", background: "#1E293B" }}
                >
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User
                      size={32}
                      className="text-white/20 group-hover:text-orange-500 transition-colors"
                    />
                  )}
                </div>
                <div className="absolute inset-0 rounded-[18px] bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={18} className="text-white" />
                </div>
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0F172A]"
                  style={{ background: "#BF5700" }}
                >
                  <Camera size={9} className="text-white" />
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />

              {/* Name + meta */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Name */}
                {editField === "name" ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={drafts["name"] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, name: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit("name")
                        if (e.key === "Escape") cancelEdit()
                      }}
                      className="bg-transparent border-b text-[28px] font-semibold text-white focus:outline-none pb-0.5"
                      style={{
                        borderColor: "#BF5700",
                        fontFamily: "var(--font-crimson), serif",
                        minWidth: 220,
                      }}
                    />
                    <button
                      onClick={() => commitEdit("name")}
                      className="p-1.5 rounded-lg text-orange-400 transition-colors"
                      style={{ background: "rgba(191,87,0,0.18)" }}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit("name", profile.name)}
                    className="flex items-center gap-2 group/n"
                  >
                    <h1
                      className="text-[28px] font-semibold text-white leading-tight"
                      style={{ fontFamily: "var(--font-crimson), serif" }}
                    >
                      {profile.name}
                    </h1>
                    <Edit3
                      size={13}
                      className="text-white/20 opacity-0 group-hover/n:opacity-100 group-hover/n:text-orange-400 transition-all"
                    />
                  </button>
                )}

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { field: "eid", Icon: Hash, display: profile.eid || "Add EID" },
                      {
                        field: "gradYear",
                        Icon: GraduationCap,
                        display: profile.gradYear ? `Class of ${profile.gradYear}` : "Add grad year",
                      },
                      {
                        field: "appCycle",
                        Icon: Calendar,
                        display: profile.appCycle ? `Cycle ${profile.appCycle}` : "Add cycle",
                      },
                    ] as { field: string; Icon: typeof Hash; display: string }[]
                  ).map(({ field, Icon, display }) =>
                    editField === field ? (
                      <div
                        key={field}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                        style={{ borderColor: "rgba(191,87,0,0.40)", background: "rgba(191,87,0,0.06)" }}
                      >
                        <Icon size={11} className="text-orange-400 flex-shrink-0" />
                        <input
                          autoFocus
                          value={drafts[field] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [field]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(field as keyof Profile)
                            if (e.key === "Escape") cancelEdit()
                          }}
                          className="bg-transparent text-white text-xs focus:outline-none w-24"
                          style={{ fontFamily: "var(--font-space-mono), monospace" }}
                        />
                        <button
                          onClick={() => commitEdit(field as keyof Profile)}
                          className="text-orange-400 hover:text-orange-300"
                        >
                          <Check size={10} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-white/25 hover:text-white/50"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <button
                        key={field}
                        onClick={() => startEdit(field, String((profile as unknown as Record<string, unknown>)[field] ?? ""))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] transition-colors group/p"
                      >
                        <Icon size={11} className="flex-shrink-0" style={{ color: "#BF5700" }} />
                        <span className="text-xs text-white/60">{display}</span>
                        <Edit3
                          size={9}
                          className="text-white/15 opacity-0 group-hover/p:opacity-100 transition-opacity"
                        />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Completeness ring */}
              <div className="flex-shrink-0 self-center">
                <RingChart score={score} />
              </div>
            </div>
          </Card>

          {/* ═══════════════════════════════════════════════════
              APPLICATION STATUS
          ══════════════════════════════════════════════════════ */}
          <Card>
            <SectionHead>Application Status</SectionHead>
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const past = statusIdx > i
                const current = statusIdx === i
                const active = past || current
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <button
                      onClick={() => setProfile((p) => ({ ...p, appStatus: step.key }))}
                      className="flex flex-col items-center gap-2 flex-shrink-0 group"
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                        style={{
                          borderColor: active ? "#BF5700" : "rgba(255,255,255,0.10)",
                          background: current
                            ? "#BF5700"
                            : past
                            ? "rgba(191,87,0,0.18)"
                            : "transparent",
                        }}
                      >
                        {past ? (
                          <Check size={13} style={{ color: "#BF5700" }} />
                        ) : current ? (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        )}
                      </div>
                      <span
                        className="text-[11px] font-medium whitespace-nowrap transition-colors"
                        style={{ color: active ? "#F8FAFC" : "rgba(255,255,255,0.25)" }}
                      >
                        {step.label}
                      </span>
                    </button>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className="h-px flex-1 mx-1 -mt-5 transition-colors duration-500"
                        style={{ background: past ? "#BF5700" : "rgba(255,255,255,0.07)" }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* ═══════════════════════════════════════════════════
              MAIN GRID
          ══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ────────── LEFT col (2/3) ────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* ── Academic Stats ── */}
              <Card>
                <SectionHead>Academic Stats</SectionHead>

                {/* GPA */}
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-widest text-white/25 mb-3">GPA</p>
                  <div className="grid grid-cols-2 gap-6">
                    {(
                      [
                        { label: "Overall GPA", field: "overall" as const },
                        { label: "Science GPA", field: "science" as const },
                      ]
                    ).map(({ label, field }) => {
                      const key = `gpa_${field}`
                      const val = profile.gpa[field]
                      return (
                        <div key={field} className="group">
                          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">
                            {label}
                          </p>
                          {editField === key ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                autoFocus
                                type="number"
                                min={0}
                                max={4}
                                step={0.01}
                                value={drafts[key] ?? ""}
                                onChange={(e) =>
                                  setDrafts((d) => ({ ...d, [key]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setProfile((p) => ({
                                      ...p,
                                      gpa: {
                                        ...p.gpa,
                                        [field]: parseFloat(drafts[key]) || 0,
                                      },
                                    }))
                                    setEditField(null)
                                  }
                                  if (e.key === "Escape") cancelEdit()
                                }}
                                className="w-20 rounded-lg px-2.5 py-1 text-white text-sm focus:outline-none"
                                style={{
                                  background: "#0F172A",
                                  border: "1px solid rgba(191,87,0,0.45)",
                                  fontFamily: "var(--font-space-mono), monospace",
                                }}
                              />
                              <button
                                onClick={() => {
                                  setProfile((p) => ({
                                    ...p,
                                    gpa: {
                                      ...p.gpa,
                                      [field]: parseFloat(drafts[key]) || 0,
                                    },
                                  }))
                                  setEditField(null)
                                }}
                                className="p-1.5 rounded-lg text-orange-400 transition-colors"
                                style={{ background: "rgba(191,87,0,0.15)" }}
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-lg text-white/25 hover:bg-white/[0.05]"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(key, String(val))}
                              className="flex items-center gap-2 group/g"
                            >
                              <span
                                className="text-2xl font-bold text-white"
                                style={{ fontFamily: "var(--font-space-mono), monospace" }}
                              >
                                {val.toFixed(2)}
                              </span>
                              <Edit3
                                size={11}
                                className="text-white/15 opacity-0 group-hover/g:opacity-100 group-hover/g:text-orange-400 transition-all"
                              />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-white/[0.05] mb-6" />

                {/* MCAT */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-white/25">MCAT</p>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="text-4xl font-bold text-white"
                        style={{ fontFamily: "var(--font-space-mono), monospace" }}
                      >
                        {profile.mcat.total}
                      </span>
                      <span className="text-sm text-white/30">/528</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MCAT_SECTIONS.map((sec) => {
                      const val = profile.mcat[sec.key]
                      const pct = mcatPct(val)
                      const isEditing = mcatEdit === sec.key
                      return (
                        <div
                          key={sec.key}
                          className="relative rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5 group hover:border-white/[0.10] transition-colors"
                        >
                          <p className="text-[9px] uppercase tracking-widest text-white/35 mb-0.5">
                            {sec.label}
                          </p>
                          <p className="text-[8px] text-white/20 mb-2 leading-tight">{sec.name}</p>
                          {isEditing ? (
                            <div className="flex flex-col gap-1.5">
                              <input
                                autoFocus
                                type="number"
                                min={118}
                                max={132}
                                value={mcatDraft}
                                onChange={(e) => setMcatDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveMcat()
                                  if (e.key === "Escape") setMcatEdit(null)
                                }}
                                className="w-full rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                                style={{
                                  background: "#0F172A",
                                  border: "1px solid rgba(191,87,0,0.40)",
                                  fontFamily: "var(--font-space-mono), monospace",
                                }}
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={saveMcat}
                                  className="flex-1 py-1 rounded-lg text-orange-400 text-xs transition-colors"
                                  style={{ background: "rgba(191,87,0,0.15)" }}
                                >
                                  <Check size={11} className="mx-auto" />
                                </button>
                                <button
                                  onClick={() => setMcatEdit(null)}
                                  className="flex-1 py-1 rounded-lg text-white/25 hover:bg-white/[0.05]"
                                >
                                  <X size={11} className="mx-auto" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setMcatEdit(sec.key)
                                setMcatDraft(String(val))
                              }}
                              className="w-full text-left"
                            >
                              <span
                                className="text-2xl font-bold text-white"
                                style={{ fontFamily: "var(--font-space-mono), monospace" }}
                              >
                                {val}
                              </span>
                            </button>
                          )}
                          {/* Score bar: range 118–132 */}
                          <div className="mt-2.5 h-0.5 bg-white/[0.07] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: "#BF5700" }}
                            />
                          </div>
                          <Edit3
                            size={9}
                            className="absolute top-2.5 right-2.5 text-white/15 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>

              {/* ── Personal Statement ── */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="block h-[18px] w-[3px] flex-shrink-0 rounded-full"
                      style={{ background: "#BF5700" }}
                    />
                    <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/40">
                      Personal Statement
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {saveState === "saving" && (
                      <span className="text-white/35 flex items-center gap-1.5">
                        <Loader2 size={11} className="animate-spin" />
                        Saving…
                      </span>
                    )}
                    {saveState === "saved" && (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Check size={11} />
                        Saved
                      </span>
                    )}
                    <span
                      style={{
                        color:
                          words > 650 ? "#F87171" : words > 600 ? "#FBBF24" : "rgba(255,255,255,0.30)",
                        fontFamily: "var(--font-space-mono), monospace",
                        fontSize: "11px",
                      }}
                    >
                      {words}{" "}
                      <span style={{ color: "rgba(255,255,255,0.18)" }}>/ 650</span>
                    </span>
                  </div>
                </div>

                {/* Word count bar */}
                <div className="h-px bg-white/[0.06] rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min((words / 650) * 100, 100)}%`,
                      background:
                        words > 650 ? "#F87171" : words > 600 ? "#FBBF24" : "#BF5700",
                    }}
                  />
                </div>

                <textarea
                  rows={14}
                  value={profile.personalStatement}
                  onChange={(e) => {
                    setProfile((p) => ({ ...p, personalStatement: e.target.value }))
                    triggerSave()
                  }}
                  placeholder="Begin writing your personal statement…"
                  className="w-full bg-transparent text-white/75 leading-[1.78] resize-none focus:outline-none placeholder:text-white/15"
                  style={{
                    fontFamily: "var(--font-crimson), Georgia, serif",
                    fontSize: "15.5px",
                  }}
                />

                {words > 650 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                    <AlertCircle size={11} />
                    {words - 650} words over limit — trim before submitting
                  </div>
                )}
              </Card>
            </div>

            {/* ────────── RIGHT col (1/3) ────────── */}
            <div className="space-y-5">

              {/* ── Hours Tracker ── */}
              <Card>
                <SectionHead>Experience Hours</SectionHead>
                <div className="space-y-5">
                  {HOURS_CFG.map(({ key, label, Icon, color }) => {
                    const cur = profile.hours[key]
                    const med = HPO_MEDIANS[key]
                    const max = Math.max(cur, med) * 1.35
                    const curPct = Math.min((cur / max) * 100, 100)
                    const medPct = Math.min((med / max) * 100, 100)
                    const above = cur >= med
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Icon size={12} style={{ color }} />
                            <span className="text-xs text-white/50">{label}</span>
                          </div>
                          <div className="flex items-baseline gap-0.5">
                            <input
                              type="number"
                              min={0}
                              value={cur}
                              onChange={(e) => {
                                const n = Math.max(0, parseInt(e.target.value) || 0)
                                setProfile((p) => ({
                                  ...p,
                                  hours: { ...p.hours, [key]: n },
                                }))
                              }}
                              className="w-14 text-right text-sm font-bold bg-transparent text-white focus:outline-none border-b border-transparent hover:border-white/20 focus:border-orange-500 transition-colors"
                              style={{ fontFamily: "var(--font-space-mono), monospace" }}
                            />
                            <span className="text-[10px] text-white/20">h</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="relative h-1.5 bg-white/[0.06] rounded-full">
                          <div
                            className="absolute h-full rounded-full transition-all duration-500"
                            style={{ width: `${curPct}%`, backgroundColor: color, opacity: 0.75 }}
                          />
                          {/* Median marker */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-px h-3 rounded-full"
                            style={{
                              left: `${medPct}%`,
                              background: "rgba(251,191,36,0.45)",
                            }}
                            title={`HPO Median: ${med}h`}
                          />
                        </div>

                        <div className="flex justify-between mt-1">
                          <span
                            className="text-[9px]"
                            style={{ color: above ? "#34D399" : "rgba(255,255,255,0.22)" }}
                          >
                            {above
                              ? `+${cur - med}h above median`
                              : `${med - cur}h to median`}
                          </span>
                          <span className="text-[9px] text-white/20 flex items-center gap-1">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{ background: "rgba(251,191,36,0.40)" }}
                            />
                            med {med}h
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* ── Profile Completeness ── */}
              <Card>
                <SectionHead>Profile Completeness</SectionHead>
                <div className="flex flex-col items-center gap-5">
                  <RingChart score={score} />

                  {missing.length > 0 ? (
                    <div className="w-full">
                      <p className="text-[9px] uppercase tracking-widest text-white/25 flex items-center gap-1.5 mb-3">
                        <AlertCircle size={9} />
                        Missing fields
                      </p>
                      <ul className="space-y-2">
                        {missing.map((m) => (
                          <li key={m} className="flex items-center gap-2 text-xs text-white/40">
                            <span
                              className="w-1 h-1 rounded-full flex-shrink-0"
                              style={{ background: "rgba(191,87,0,0.55)" }}
                            />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-emerald-400 text-sm flex items-center gap-2 justify-center">
                        <Check size={14} />
                        Profile complete!
                      </p>
                      <p className="text-white/25 text-xs mt-1">
                        Ready to submit applications
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
