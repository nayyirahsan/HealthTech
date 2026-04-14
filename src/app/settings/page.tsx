"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import {
  User, Layers, Bell, BarChart3, Shield, Palette, Bot,
  Download, Trash2, AlertTriangle, Sun, Moon, Monitor,
  Eye, EyeOff, Check, ExternalLink, Zap, MessageSquare,
  Info, BookOpen,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionId =
  | "account"
  | "preferences"
  | "notifications"
  | "benchmark"
  | "privacy"
  | "appearance"
  | "ai";

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  hint: string;
}[] = [
  { id: "account",       label: "Account",          icon: User,     hint: "Email, password, SSO"   },
  { id: "preferences",   label: "App Preferences",  icon: Layers,   hint: "Cycle, system, degree"  },
  { id: "notifications", label: "Notifications",    icon: Bell,     hint: "Alerts & reminders"     },
  { id: "benchmark",     label: "Benchmarks",       icon: BarChart3,hint: "Comparison groups"      },
  { id: "privacy",       label: "Data & Privacy",   icon: Shield,   hint: "Export & deletion"      },
  { id: "appearance",    label: "Appearance",        icon: Palette,  hint: "Theme & accent color"   },
  { id: "ai",            label: "AI Preferences",   icon: Bot,      hint: "Style & context"        },
];

const ACCENT_COLORS = [
  { name: "Burnt Orange", hex: "#BF5700" },
  { name: "Emerald",      hex: "#10B981" },
  { name: "Sky Blue",     hex: "#0EA5E9" },
  { name: "Violet",       hex: "#8B5CF6" },
  { name: "Rose",         hex: "#F43F5E" },
  { name: "Amber",        hex: "#F59E0B" },
];

const DATA_SOURCES = [
  { name: "AAMC MSAR",   desc: "Medical School Admissions Requirements",           year: "2023"    },
  { name: "TMDSAS",      desc: "Texas Medical & Dental Schools Application Service",year: "2022–23" },
  { name: "UT HPO",      desc: "Health Professions Office Advising Data",           year: "2022"    },
  { name: "NRMP",        desc: "National Resident Matching Program Data",           year: "2023"    },
  { name: "AAMC Stats",  desc: "Association of American Medical Colleges Statistics",year: "2023"   },
];

// ── Shared primitives ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF5700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] ${
        checked ? "bg-[#BF5700]" : "bg-white/[0.15]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  extra,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/[0.05] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 font-medium">{label}</p>
        {description && (
          <p className="text-xs text-white/30 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
        {extra}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
  size = "sm",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "xs";
}) {
  return (
    <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md font-medium transition-all duration-150 ${
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]"
          } ${
            value === opt.value
              ? "bg-[#BF5700] text-white shadow-sm"
              : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl overflow-hidden">
      {children}
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4 border-b border-white/[0.05] last:border-0">
      <div>
        <p className="text-sm text-white/75 font-medium">{label}</p>
        {description && (
          <p className="text-xs text-white/30 mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionHeader({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-white">{label}</h2>
      {description && (
        <p className="text-sm text-white/40 mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.12em] px-0.5 mb-2">
      {children}
    </p>
  );
}

function SaveButton({
  onClick,
  saved,
}: {
  onClick: () => void;
  saved: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 ${
        saved
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-[#BF5700] text-white hover:bg-[#A04800] active:scale-[0.97]"
      }`}
    >
      {saved ? (
        <>
          <Check size={12} />
          Saved
        </>
      ) : (
        "Save Changes"
      )}
    </button>
  );
}

// ── Account section ───────────────────────────────────────────────────────────

function AccountSection() {
  const [email, setEmail]           = useState("alexj@utexas.edu");
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [pwSaved, setPwSaved]       = useState(false);

  function handleSaveEmail() {
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2200);
  }

  function handleSavePw() {
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2200);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }

  const inputCls =
    "w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#BF5700]/50 focus:bg-white/[0.07] transition-all";

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        label="Account"
        description="Manage your login credentials and connected authentication providers."
      />

      {/* Email */}
      <div>
        <SubLabel>Email Address</SubLabel>
        <SectionCard>
          <div className="px-5 py-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-[11px] text-white/30 uppercase tracking-[0.1em] mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
              <SaveButton onClick={handleSaveEmail} saved={emailSaved} />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Password */}
      <div>
        <SubLabel>Change Password</SubLabel>
        <SectionCard>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="text-[11px] text-white/30 uppercase tracking-[0.1em] mb-1.5 block">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls + " pr-10"}
                />
                <button
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/30 uppercase tracking-[0.1em] mb-1.5 block">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls + " pr-10"}
                />
                <button
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors"
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/30 uppercase tracking-[0.1em] mb-1.5 block">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
            <div className="flex justify-end pt-1">
              <SaveButton onClick={handleSavePw} saved={pwSaved} />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Connected accounts */}
      <div>
        <SubLabel>Connected Accounts</SubLabel>
        <SectionCard>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                {/* Google color logo */}
                <svg width="16" height="16" viewBox="0 0 24 24" aria-label="Google">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-white/80 font-medium">Google</p>
                <p className="text-xs text-white/30 mt-0.5 font-mono">alexj@utexas.edu</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <Check size={11} strokeWidth={2.5} />
                Connected
              </span>
              <button className="text-xs text-white/25 hover:text-red-400 transition-colors">
                Disconnect
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Preferences section ───────────────────────────────────────────────────────

function PreferencesSection() {
  const [cycle, setCycle]           = useState("2026");
  const [appSystem, setAppSystem]   = useState("tmdsas");
  const [degreeTarget, setDegreeTarget] = useState("md");

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        label="Application Preferences"
        description="Configure your application cycle, system, and degree goals. These preferences personalize school list recommendations, deadline tracking, and AI advisor responses."
      />

      <SectionCard>
        <SettingRow
          label="Target Application Cycle"
          description="Which cycle are you applying in?"
        >
          <SegmentedControl
            options={[
              { value: "2025", label: "2025" },
              { value: "2026", label: "2026" },
              { value: "2027", label: "2027" },
            ]}
            value={cycle}
            onChange={setCycle}
          />
        </SettingRow>

        <SettingRow
          label="Application System"
          description="Which system(s) are you applying through?"
        >
          <SegmentedControl
            options={[
              { value: "tmdsas", label: "TMDSAS" },
              { value: "amcas",  label: "AMCAS"  },
              { value: "both",   label: "Both"   },
            ]}
            value={appSystem}
            onChange={setAppSystem}
          />
        </SettingRow>

        <SettingRow
          label="Degree Target"
          description="What type of degree are you pursuing?"
        >
          <SegmentedControl
            options={[
              { value: "md",     label: "MD"     },
              { value: "do",     label: "DO"     },
              { value: "md-phd", label: "MD-PhD" },
              { value: "both",   label: "Both"   },
            ]}
            value={degreeTarget}
            onChange={setDegreeTarget}
          />
        </SettingRow>
      </SectionCard>

      <div className="flex items-start gap-2.5 bg-[#BF5700]/[0.06] border border-[#BF5700]/20 rounded-xl px-4 py-3">
        <Info size={14} className="text-[#BF5700] mt-0.5 shrink-0" />
        <p className="text-xs text-white/50 leading-relaxed">
          These settings affect school filtering defaults, deadline tracking, and AI advisor context. You can update them at any time without losing your data.
        </p>
      </div>
    </div>
  );
}

// ── Notifications section ─────────────────────────────────────────────────────

function NotificationsSection() {
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [daysBeforeDeadline, setDaysBeforeDeadline] = useState(14);
  const [weeklyGapReport, setWeeklyGapReport]     = useState(true);
  const [opportunityMatches, setOpportunityMatches] = useState(false);
  const [interviewAlerts, setInterviewAlerts]     = useState(true);

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        label="Notifications"
        description="Control which alerts and reports are sent to you. Changes take effect immediately."
      />

      <SectionCard>
        {/* Deadline reminders — has inline days input */}
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-white/80 font-medium">Deadline Reminders</p>
              <p className="text-xs text-white/30 mt-0.5">
                Get notified before application deadlines
              </p>
              {deadlineReminders && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-white/40">Alert me</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={daysBeforeDeadline}
                    onChange={(e) =>
                      setDaysBeforeDeadline(
                        Math.max(1, Math.min(60, Number(e.target.value)))
                      )
                    }
                    className="w-12 bg-white/[0.07] border border-white/[0.10] rounded-md px-2 py-1 text-xs text-white/80 text-center focus:outline-none focus:border-[#BF5700]/50 transition-all"
                  />
                  <span className="text-xs text-white/40">days before</span>
                </div>
              )}
            </div>
            <Toggle checked={deadlineReminders} onChange={setDeadlineReminders} />
          </div>
        </div>

        <ToggleRow
          label="Weekly Profile Gap Report"
          description="A weekly summary of where your profile stands versus the UT median"
          checked={weeklyGapReport}
          onChange={setWeeklyGapReport}
        />
        <ToggleRow
          label="New Opportunity Matches"
          description="Notify when new research, clinical, or volunteer opportunities match your profile"
          checked={opportunityMatches}
          onChange={setOpportunityMatches}
        />
        <ToggleRow
          label="Interview Invite Alerts"
          description="Push notification when a school updates your application status to interview"
          checked={interviewAlerts}
          onChange={setInterviewAlerts}
        />
      </SectionCard>
    </div>
  );
}

// ── Benchmark section ─────────────────────────────────────────────────────────

function BenchmarkSection() {
  const [benchmark, setBenchmark] = useState("ut");

  const options = [
    {
      value: "ut",
      label: "UT Admitted Students",
      desc: "Compare your profile against UT Austin students who were admitted to medical school. Reflects local competition and HPO standards.",
      badge: "Default",
    },
    {
      value: "national",
      label: "National Averages",
      desc: "Compare against AAMC national applicant and accepted student data. Best for understanding your standing across all schools.",
      badge: null,
    },
    {
      value: "both",
      label: "Both",
      desc: "Show side-by-side comparisons with both UT and national benchmarks wherever data is available.",
      badge: null,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        label="Benchmark Comparison"
        description="Choose which dataset to compare your profile against throughout the app — in stat cards, the chance calculator, and AI advisor responses."
      />

      <div className="space-y-3">
        {options.map((opt) => {
          const active = benchmark === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setBenchmark(opt.value)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
                active
                  ? "bg-[#BF5700]/[0.08] border-[#BF5700]/40"
                  : "bg-white/[0.025] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Radio dot */}
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    active ? "border-[#BF5700] bg-[#BF5700]" : "border-white/25"
                  }`}
                >
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold transition-colors ${
                        active ? "text-[#BF5700]" : "text-white/75"
                      }`}
                    >
                      {opt.label}
                    </p>
                    {opt.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.07] text-white/30 font-medium">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/35 mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Privacy section ───────────────────────────────────────────────────────────

function PrivacySection({
  onDeleteRequest,
}: {
  onDeleteRequest: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported]   = useState(false);

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    }, 1200);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        label="Data & Privacy"
        description="Manage your data, review the sources used in this app, and control account deletion."
      />

      {/* Export */}
      <div>
        <SubLabel>Your Data</SubLabel>
        <SectionCard>
          <div className="px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/80 font-medium">Export All Data</p>
              <p className="text-xs text-white/30 mt-0.5 leading-relaxed">
                Download a complete JSON export of your profile, school list,
                activities, and settings.
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 ${
                exported
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : exporting
                  ? "bg-white/[0.06] text-white/25 cursor-not-allowed"
                  : "bg-white/[0.07] text-white/60 border border-white/[0.10] hover:bg-white/[0.12] hover:text-white/85"
              }`}
            >
              {exported ? (
                <>
                  <Check size={12} />
                  Downloaded
                </>
              ) : exporting ? (
                <>
                  <Download
                    size={12}
                    className="animate-bounce"
                  />
                  Preparing…
                </>
              ) : (
                <>
                  <Download size={12} />
                  Export JSON
                </>
              )}
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Data sources */}
      <div>
        <SubLabel>Data Sources</SubLabel>
        <SectionCard>
          {DATA_SOURCES.map((src, i) => (
            <div
              key={src.name}
              className={`px-5 py-3.5 flex items-center justify-between gap-4 ${
                i < DATA_SOURCES.length - 1 ? "border-b border-white/[0.05]" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/75 font-medium">
                    {src.name}
                  </span>
                  <span className="text-[10px] bg-white/[0.06] text-white/30 px-1.5 py-0.5 rounded font-mono">
                    {src.year}
                  </span>
                </div>
                <p className="text-xs text-white/30 mt-0.5">{src.desc}</p>
              </div>
              <ExternalLink size={13} className="text-white/15 shrink-0" />
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Danger zone */}
      <div>
        <SubLabel>Danger Zone</SubLabel>
        <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl">
          <div className="px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-red-400 font-semibold">
                Delete Account
              </p>
              <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <button
              onClick={onDeleteRequest}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-all duration-150 shrink-0"
            >
              <Trash2 size={12} />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Appearance section ────────────────────────────────────────────────────────

function AppearanceSection() {
  const [themeMode, setThemeMode]   = useState<"dark" | "light" | "system">("dark");
  const [accentColor, setAccentColor] = useState("#BF5700");

  useEffect(() => {
    const pref = localStorage.getItem("themePreference") as
      | "dark"
      | "light"
      | "system"
      | null;
    const theme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (pref) setThemeMode(pref);
    else if (theme) setThemeMode(theme);
  }, []);

  function handleThemeChange(mode: "dark" | "light" | "system") {
    setThemeMode(mode);
    localStorage.setItem("themePreference", mode);

    let effective: "dark" | "light";
    if (mode === "system") {
      effective = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      effective = mode;
    }

    const root = document.documentElement;
    if (effective === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("theme", effective);
  }

  const themeOptions: {
    value: "dark" | "light" | "system";
    label: string;
    Icon: React.ElementType;
  }[] = [
    { value: "dark",   label: "Dark",   Icon: Moon    },
    { value: "light",  label: "Light",  Icon: Sun     },
    { value: "system", label: "System", Icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        label="Appearance"
        description="Customize how the app looks. Changes apply immediately."
      />

      {/* Theme */}
      <div>
        <SubLabel>Color Theme</SubLabel>
        <SectionCard>
          <div className="p-4 grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, Icon }) => {
              const active = themeMode === value;
              return (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex flex-col items-center gap-2.5 rounded-xl p-4 border transition-all duration-150 ${
                    active
                      ? "bg-[#BF5700]/[0.08] border-[#BF5700]/40"
                      : "bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.05]"
                  }`}
                >
                  {/* Preview swatch */}
                  <div
                    className={`w-12 h-8 rounded-md border flex items-center justify-center overflow-hidden ${
                      value === "dark"
                        ? "bg-[#080E1A] border-white/10"
                        : value === "light"
                        ? "bg-slate-50 border-slate-200/60"
                        : "border-white/10"
                    }`}
                    style={
                      value === "system"
                        ? {
                            background:
                              "linear-gradient(135deg, #080E1A 50%, #F8FAFC 50%)",
                          }
                        : {}
                    }
                  >
                    <Icon
                      size={14}
                      className={
                        active
                          ? "text-[#BF5700]"
                          : value === "light"
                          ? "text-slate-500"
                          : "text-white/35"
                      }
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      active ? "text-[#BF5700]" : "text-white/45"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Accent color */}
      <div>
        <SubLabel>Accent Color</SubLabel>
        <SectionCard>
          <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
            {ACCENT_COLORS.map(({ name, hex }) => (
              <button
                key={hex}
                title={name}
                onClick={() => setAccentColor(hex)}
                className="relative w-7 h-7 rounded-full transition-transform hover:scale-110 duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
                style={{ backgroundColor: hex }}
              >
                {accentColor === hex && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="text-white drop-shadow"
                    />
                  </span>
                )}
              </button>
            ))}
            <span className="text-[11px] text-white/20 ml-1">
              Burnt Orange is the default UT theme
            </span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── AI Preferences section ────────────────────────────────────────────────────

function AISection() {
  const [responseStyle, setResponseStyle]         = useState("detailed");
  const [useProfileContext, setUseProfileContext]  = useState(true);

  const styleOptions = [
    {
      value: "concise",
      label: "Concise",
      desc:  "Direct, to-the-point answers. Best for quick lookups and factual queries.",
      Icon:  Zap,
    },
    {
      value: "detailed",
      label: "Detailed",
      desc:  "Thorough responses with context and nuance. Good for deep dives.",
      Icon:  MessageSquare,
    },
    {
      value: "socratic",
      label: "Socratic",
      desc:  "Guided through questions and reasoning. Helps you think through decisions.",
      Icon:  BookOpen,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        label="AI Preferences"
        description="Customize how Claude responds in the AI Advisor. These settings apply to all new conversations."
      />

      {/* Response style */}
      <div>
        <SubLabel>Response Style</SubLabel>
        <div className="grid grid-cols-3 gap-3">
          {styleOptions.map(({ value, label, desc, Icon }) => {
            const active = responseStyle === value;
            return (
              <button
                key={value}
                onClick={() => setResponseStyle(value)}
                className={`text-left rounded-xl border p-4 transition-all duration-150 ${
                  active
                    ? "bg-[#BF5700]/[0.08] border-[#BF5700]/40"
                    : "bg-white/[0.025] border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.04]"
                }`}
              >
                <Icon
                  size={16}
                  className={`mb-2.5 ${
                    active ? "text-[#BF5700]" : "text-white/30"
                  }`}
                />
                <p
                  className={`text-sm font-semibold mb-1 ${
                    active ? "text-[#BF5700]" : "text-white/70"
                  }`}
                >
                  {label}
                </p>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  {desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile context */}
      <div>
        <SubLabel>Context</SubLabel>
        <SectionCard>
          <ToggleRow
            label="Use Profile Data as Context"
            description="When enabled, the AI advisor automatically includes your GPA, MCAT, activities, and school list in every conversation. Disable for generic, unpersonalized responses."
            checked={useProfileContext}
            onChange={setUseProfileContext}
          />
        </SectionCard>
      </div>

      <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
        <Info size={14} className="text-white/25 mt-0.5 shrink-0" />
        <p className="text-xs text-white/35 leading-relaxed">
          AI responses are powered by Claude (Anthropic). Your profile data is
          never used to train the model. See the{" "}
          <a
            href="#"
            className="text-[#BF5700]/70 hover:text-[#BF5700] underline underline-offset-2"
          >
            privacy policy
          </a>{" "}
          for details.
        </p>
      </div>
    </div>
  );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [input, setInput]         = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const CONFIRM_PHRASE            = "delete my account";
  const ready                     = input === CONFIRM_PHRASE;

  function handleClose() {
    setInput("");
    setConfirmed(false);
    onClose();
  }

  function handleConfirm() {
    if (!ready) return;
    setConfirmed(true);
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Delete Account">
      {confirmed ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={20} className="text-red-400" />
          </div>
          <p className="text-sm font-semibold text-white/80">
            Deletion request submitted
          </p>
          <p className="text-xs text-white/35 mt-1.5 leading-relaxed">
            You will receive a confirmation email at{" "}
            <span className="font-mono text-white/50">alexj@utexas.edu</span>.
            <br />
            Your account will be deleted within 24 hours.
          </p>
          <button
            onClick={handleClose}
            className="mt-5 px-4 py-2 rounded-lg text-xs font-semibold text-white/50 hover:text-white/80 bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-500/[0.07] border border-red-500/20 rounded-xl px-4 py-3">
            <AlertTriangle
              size={15}
              className="text-red-400 shrink-0 mt-0.5"
            />
            <p className="text-sm text-white/55 leading-relaxed">
              This will permanently delete your account, school list,
              activities, and all profile data. This action{" "}
              <span className="text-red-400 font-semibold">
                cannot be undone
              </span>
              .
            </p>
          </div>

          <div>
            <label className="text-[11px] text-white/35 uppercase tracking-[0.12em] mb-2 block">
              Type{" "}
              <span className="text-white/50 font-mono normal-case tracking-normal">
                {CONFIRM_PHRASE}
              </span>{" "}
              to confirm
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3.5 py-2 text-sm text-white/80 placeholder-white/15 focus:outline-none focus:border-red-500/40 transition-all"
            />
          </div>

          <div className="flex gap-2.5 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white/45 hover:text-white/75 bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!ready}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            >
              <Trash2 size={12} />
              Delete Permanently
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("account");
  const [deleteOpen, setDeleteOpen]       = useState(false);

  return (
    <div className="bg-[#0F172A] min-h-full flex flex-col">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-white/[0.07] shrink-0">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-white/35 mt-0.5">
          Manage your account, preferences, and application settings.
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop left nav */}
        <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-white/[0.07] py-3 px-2 gap-0.5">
          {SECTIONS.map(({ id, label, icon: Icon, hint }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                  active
                    ? "bg-[#BF5700]/[0.12] text-[#BF5700]"
                    : "text-white/40 hover:text-white/75 hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-none truncate">
                    {label}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 leading-none truncate ${
                      active
                        ? "text-[#BF5700]/55"
                        : "text-white/20 group-hover:text-white/30"
                    }`}
                  >
                    {hint}
                  </p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Content area + mobile tabs */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile section tabs */}
          <div className="md:hidden border-b border-white/[0.07] px-3 py-2 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-hide">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  activeSection === id
                    ? "bg-[#BF5700]/20 text-[#BF5700]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {activeSection === "account"       && <AccountSection />}
            {activeSection === "preferences"   && <PreferencesSection />}
            {activeSection === "notifications" && <NotificationsSection />}
            {activeSection === "benchmark"     && <BenchmarkSection />}
            {activeSection === "privacy"       && (
              <PrivacySection onDeleteRequest={() => setDeleteOpen(true)} />
            )}
            {activeSection === "appearance"    && <AppearanceSection />}
            {activeSection === "ai"            && <AISection />}
          </main>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
