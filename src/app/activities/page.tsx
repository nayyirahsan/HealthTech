"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Plus, Download, Star, AlertTriangle, Search, X, Copy, FileText,
  ChevronDown, Check,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "Clinical" | "Research" | "Volunteering" | "Shadowing" | "Leadership" | "Other";

interface ActivityItem {
  id: string;
  name: string;
  category: Category;
  hours: number;
  startDate: string;
  endDate: string;
  organization: string;
  description: string;
  mostMeaningful: boolean;
}

interface FormState {
  name: string;
  category: Category;
  organization: string;
  startDate: string;
  endDate: string;
  hours: string;
  description: string;
  mostMeaningful: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ["Clinical", "Research", "Volunteering", "Shadowing", "Leadership", "Other"];

const CAT_CFG: Record<Category, { color: string; text: string; bg: string; border: string }> = {
  Clinical:     { color: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  Research:     { color: "#3b82f6", text: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/30"    },
  Volunteering: { color: "#8b5cf6", text: "text-violet-400",  bg: "bg-violet-500/15",  border: "border-violet-500/30"  },
  Shadowing:    { color: "#f59e0b", text: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/30"   },
  Leadership:   { color: "#f43f5e", text: "text-rose-400",    bg: "bg-rose-500/15",    border: "border-rose-500/30"    },
  Other:        { color: "#64748b", text: "text-slate-400",   bg: "bg-slate-500/15",   border: "border-slate-500/30"   },
};

// UT HPO median for admitted applicants (aligned with dashboard/ut-benchmarks)
const UT_MEDIANS: Record<Category, number> = {
  Clinical:     1200,
  Research:     600,
  Volunteering: 250,
  Shadowing:    120,
  Leadership:   75,
  Other:        100,
};

const EMPTY_FORM: FormState = {
  name: "", category: "Clinical", organization: "",
  startDate: "", endDate: "", hours: "", description: "", mostMeaningful: false,
};

// ── Mock Data ─────────────────────────────────────────────────────────────────

const SEED_ACTIVITIES: ActivityItem[] = [
  {
    id: "1", name: "Emergency Department Volunteer", category: "Clinical", hours: 340,
    startDate: "2023-06-01", endDate: "2024-05-31",
    organization: "Dell Seton Medical Center at UT Austin",
    description: "Assisted nursing staff with patient transport, vital sign documentation, and family communication in a Level I trauma center. Observed over 200 patient encounters including trauma activations and critical care procedures. This experience solidified my commitment to emergency medicine and patient advocacy in high-acuity settings.",
    mostMeaningful: true,
  },
  {
    id: "2", name: "Neuroinflammation Research Coordinator", category: "Research", hours: 280,
    startDate: "2023-09-01", endDate: "2024-12-31",
    organization: "UT Austin Waggoner Center for Alcohol & Addiction Research",
    description: "Coordinated IRB-approved study on neuroinflammatory markers in early-onset Alzheimer's disease. Recruited 60+ participants, collected blood samples, maintained REDCap database, and contributed to two manuscript submissions currently under peer review at Neurology.",
    mostMeaningful: true,
  },
  {
    id: "3", name: "Free Clinic Medical Interpreter", category: "Volunteering", hours: 180,
    startDate: "2022-09-01", endDate: "2024-05-15",
    organization: "People's Community Clinic",
    description: "Provided Spanish-English medical interpretation for uninsured patients during clinical encounters. Facilitated communication between physicians and patients during history-taking, diagnosis discussions, and treatment planning for 400+ encounters. Trained 8 new volunteer interpreters.",
    mostMeaningful: true,
  },
  {
    id: "4", name: "Physician Shadowing — Internal Medicine", category: "Shadowing", hours: 120,
    startDate: "2023-01-10", endDate: "2023-08-20",
    organization: "Austin Internal Medicine Associates",
    description: "Shadowed Dr. Maria Chen across outpatient clinic and hospital rounds. Observed management of complex chronic conditions including DM2, CHF, and CKD. Participated in morning teaching rounds and case conferences.",
    mostMeaningful: false,
  },
  {
    id: "5", name: "Pre-Medical Society President", category: "Leadership", hours: 200,
    startDate: "2023-05-01", endDate: "2024-05-01",
    organization: "UT Austin Pre-Medical Society",
    description: "Led 400-member organization through full academic year. Organized 12 physician panel events, secured $8,000 in university funding, and established mentorship program pairing freshmen with upperclassmen applicants. Membership grew 35% under my tenure.",
    mostMeaningful: false,
  },
  {
    id: "6", name: "Biochemistry Teaching Assistant", category: "Leadership", hours: 90,
    startDate: "2024-01-15", endDate: "2024-05-10",
    organization: "UT Austin Dept. of Biochemistry",
    description: "Led weekly discussion sections for BCH 369 with 25 students. Held office hours, graded exams, and designed supplementary review materials. End-of-semester evaluations: 4.8/5.0 instructor rating.",
    mostMeaningful: false,
  },
  {
    id: "7", name: "Medical Scribe — Orthopedic Surgery", category: "Clinical", hours: 310,
    startDate: "2022-08-01", endDate: "2023-07-31",
    organization: "ScribeAmerica / St. David's Medical Center",
    description: "Documented real-time physician encounters for orthopedic surgery clinic. Completed 500+ encounter notes covering fracture management, post-operative care, and sports medicine. Obtained Level 1 ScribeAmerica certification within first 30 days.",
    mostMeaningful: false,
  },
  {
    id: "8", name: "Global Health Brigade — Honduras", category: "Volunteering", hours: 60,
    startDate: "2023-03-05", endDate: "2023-03-12",
    organization: "UT Austin Global Health Brigade",
    description: "Participated in week-long medical mission providing primary care to underserved rural communities. Assisted with triage, patient intake, and pharmacy distribution for 1,400 patients across 4 clinic sites in rural Olancho Department.",
    mostMeaningful: false,
  },
  {
    id: "9", name: "Inpatient Psychiatry Shadow", category: "Shadowing", hours: 80,
    startDate: "2024-01-08", endDate: "2024-04-30",
    organization: "Austin Oaks Hospital",
    description: "Observed inpatient psychiatric unit rounds and individual therapy sessions. Gained exposure to treatment of acute psychosis, major depressive disorder, and substance use disorders in a crisis stabilization unit.",
    mostMeaningful: false,
  },
  {
    id: "10", name: "CRISPR Gene Editing Research", category: "Research", hours: 160,
    startDate: "2022-09-01", endDate: "2023-05-15",
    organization: "UT Austin Patterson Lab",
    description: "Investigated CRISPR-Cas9 efficiency in primary T-cells under Dr. Kevin Patterson. Performed flow cytometry, Western blot analysis, and cell culture maintenance. Results presented at UT Undergraduate Research Forum — awarded Best Poster in Life Sciences.",
    mostMeaningful: false,
  },
];

// ── Cumulative hours chart — hardcoded monthly data ───────────────────────────

const CHART_DATA = [
  { month: "May'23",  Clinical: 120, Research: 40,  Volunteering: 50,  Shadowing: 60,  Leadership: 0   },
  { month: "Jun'23",  Clinical: 210, Research: 40,  Volunteering: 70,  Shadowing: 80,  Leadership: 0   },
  { month: "Jul'23",  Clinical: 310, Research: 40,  Volunteering: 90,  Shadowing: 120, Leadership: 0   },
  { month: "Aug'23",  Clinical: 360, Research: 80,  Volunteering: 110, Shadowing: 120, Leadership: 0   },
  { month: "Sep'23",  Clinical: 395, Research: 130, Volunteering: 140, Shadowing: 120, Leadership: 30  },
  { month: "Oct'23",  Clinical: 430, Research: 185, Volunteering: 160, Shadowing: 140, Leadership: 65  },
  { month: "Nov'23",  Clinical: 470, Research: 230, Volunteering: 175, Shadowing: 160, Leadership: 100 },
  { month: "Dec'23",  Clinical: 500, Research: 280, Volunteering: 195, Shadowing: 175, Leadership: 125 },
  { month: "Jan'24",  Clinical: 530, Research: 320, Volunteering: 215, Shadowing: 200, Leadership: 185 },
  { month: "Feb'24",  Clinical: 570, Research: 360, Volunteering: 235, Shadowing: 200, Leadership: 235 },
  { month: "Mar'24",  Clinical: 610, Research: 400, Volunteering: 260, Shadowing: 200, Leadership: 270 },
  { month: "Apr'24",  Clinical: 650, Research: 440, Volunteering: 280, Shadowing: 200, Leadership: 290 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return "—";
  const [y, m] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function similarity(a: string, b: string): number {
  const na = a.toLowerCase().replace(/\s+/g, " ").trim();
  const nb = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (na === nb) return 1;
  const wordsA = new Set(na.split(" "));
  const wordsB = nb.split(" ");
  const common = wordsB.filter(w => wordsA.has(w) && w.length > 3).length;
  return common / Math.max(wordsA.size, wordsB.length);
}

// ── Category Badge ─────────────────────────────────────────────────────────────

function CatBadge({ cat }: { cat: Category }) {
  const cfg = CAT_CFG[cat];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cat}
    </span>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function StatBar({ cat, hours }: { cat: Category; hours: number }) {
  const median = UT_MEDIANS[cat];
  const pct = Math.min((hours / median) * 100, 100);
  const cfg = CAT_CFG[cat];
  const isAbove = hours >= median;
  const isClose = hours >= median * 0.85;

  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5 hover:border-white/15 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
          <span className="text-[11px] font-medium tracking-wide text-white/50 uppercase">{cat}</span>
        </div>
        <span className={`text-[11px] font-medium ${isAbove ? "text-emerald-400" : isClose ? "text-amber-400" : "text-white/30"}`}>
          {isAbove ? "✓ Met" : isClose ? "Close" : `${median - hours} to go`}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-xl font-bold text-white leading-none">{hours.toLocaleString()}</span>
        <span className="text-[11px] text-white/25 mb-0.5">/ {median.toLocaleString()} hrs median</span>
      </div>
      <div className="relative h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: isAbove ? "#10b981" : isClose ? "#f59e0b" : cfg.color }}
        />
        <div className="absolute top-0 right-0 w-px h-full bg-white/20" />
      </div>
    </div>
  );
}

// ── Most Meaningful Card ──────────────────────────────────────────────────────

function MeaningfulCard({ activity }: { activity: ActivityItem }) {
  return (
    <div className="bg-white/[0.04] border border-[#BF5700]/25 rounded-xl p-5 flex flex-col gap-3 hover:border-[#BF5700]/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Star size={12} className="text-[#BF5700] fill-[#BF5700] shrink-0" />
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#BF5700]">Most Meaningful</span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{activity.name}</h3>
          <p className="text-[11px] text-white/35 mt-0.5">{activity.organization}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-lg font-bold text-white">{activity.hours}</p>
          <p className="text-[10px] text-white/30">hours</p>
        </div>
      </div>
      <CatBadge cat={activity.category} />
      <p className="text-xs text-white/55 leading-relaxed line-clamp-4">{activity.description}</p>
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
        <span className="text-[11px] text-white/25 font-mono">
          {fmtDate(activity.startDate)} – {fmtDate(activity.endDate)}
        </span>
        <span className="text-[11px] text-white/30">{activity.description.length}/700 chars</span>
      </div>
    </div>
  );
}

// ── Export Modal ──────────────────────────────────────────────────────────────

function ExportModal({ activities, onClose }: { activities: ActivityItem[]; onClose: () => void }) {
  const [system, setSystem] = useState<"AMCAS" | "TMDSAS">("AMCAS");
  const [copied, setCopied] = useState<string | null>(null);

  const titleLimit = system === "AMCAS" ? 150 : 100;
  const descLimit  = system === "AMCAS" ? 700 : 300;
  const mmLimit    = system === "AMCAS" ? 1325 : 0;

  function copyAll() {
    const text = activities.map(a => {
      const title = a.name.slice(0, titleLimit);
      const desc  = a.description.slice(0, descLimit);
      return `${title}\n${a.organization} | ${a.hours} hrs | ${fmtDate(a.startDate)} – ${fmtDate(a.endDate)}\n${desc}`;
    }).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  }

  function copyOne(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="w-full max-w-2xl max-h-[85vh] bg-[#0D1628] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-white">Export Activities</h2>
              <p className="text-[11px] text-white/35 mt-0.5">Formatted to application system character limits</p>
            </div>
            <div className="flex items-center gap-2">
              {/* System toggle */}
              <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
                {(["AMCAS", "TMDSAS"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSystem(s)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      system === s ? "bg-[#BF5700] text-white" : "text-white/40 hover:text-white/70"
                    }`}
                  >{s}</button>
                ))}
              </div>
              <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Limits info */}
          <div className="px-6 py-3 border-b border-white/[0.05] bg-white/[0.02] flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-1.5">
              <FileText size={12} className="text-[#BF5700]" />
              <span className="text-[11px] text-white/40">Title limit: <span className="text-white/60 font-mono">{titleLimit} chars</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText size={12} className="text-[#BF5700]" />
              <span className="text-[11px] text-white/40">Description limit: <span className="text-white/60 font-mono">{descLimit} chars</span></span>
            </div>
            {mmLimit > 0 && (
              <div className="flex items-center gap-1.5">
                <Star size={12} className="text-[#BF5700]" />
                <span className="text-[11px] text-white/40">Most Meaningful: <span className="text-white/60 font-mono">{mmLimit} chars</span></span>
              </div>
            )}
            <button
              onClick={copyAll}
              className="ml-auto flex items-center gap-1.5 text-[11px] text-[#BF5700] hover:text-white transition-colors"
            >
              {copied === "all" ? <Check size={12} /> : <Copy size={12} />}
              {copied === "all" ? "Copied!" : "Copy all"}
            </button>
          </div>

          {/* Activity list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {activities.map(a => {
              const title = a.name.slice(0, titleLimit);
              const desc  = a.description.slice(0, descLimit);
              const truncatedTitle = a.name.length > titleLimit;
              const truncatedDesc  = a.description.length > descLimit;
              const exportText = `${title}\n${a.organization} | ${a.hours} hrs | ${fmtDate(a.startDate)} – ${fmtDate(a.endDate)}\n${desc}`;

              return (
                <div key={a.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 group">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {a.mostMeaningful && <Star size={11} className="text-[#BF5700] fill-[#BF5700] shrink-0" />}
                        <span className="text-xs font-semibold text-white">{title}</span>
                        {truncatedTitle && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">truncated</span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/35 mt-0.5 font-mono">{a.organization} · {a.hours} hrs · {fmtDate(a.startDate)}–{fmtDate(a.endDate)}</p>
                    </div>
                    <button
                      onClick={() => copyOne(a.id, exportText)}
                      className="shrink-0 p-1.5 text-white/20 hover:text-white/60 hover:bg-white/[0.06] rounded-md transition-colors"
                    >
                      {copied === a.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed font-mono">{desc}</p>
                  <div className="flex items-center justify-between mt-2">
                    <CatBadge cat={a.category} />
                    <span className={`text-[11px] font-mono ${truncatedDesc ? "text-amber-400" : "text-white/25"}`}>
                      {a.description.length}/{descLimit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Add Activity Form (inside Sheet) ──────────────────────────────────────────

function AddActivityForm({
  form,
  setForm,
  existingActivities,
  meaningfulCount,
  onSubmit,
  onClose,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  existingActivities: ActivityItem[];
  meaningfulCount: number;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const fieldClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#BF5700]/50 transition-colors";
  const labelClass = "block text-[11px] font-medium text-white/40 uppercase tracking-wide mb-1.5";

  // Duplicate detection
  const duplicates = useMemo(() => {
    if (!form.name.trim() || form.name.length < 4) return [];
    return existingActivities.filter(a => similarity(a.name, form.name) > 0.45);
  }, [form.name, existingActivities]);

  const canAddMeaningful = meaningfulCount < 3 || form.mostMeaningful;
  const isValid = form.name.trim() && form.organization.trim() && form.hours && form.startDate;

  return (
    <div className="flex flex-col h-full">
      {/* Sheet header */}
      <div className="px-6 py-5 border-b border-white/[0.07] shrink-0">
        <h2 className="text-sm font-semibold text-white">Log Activity</h2>
        <p className="text-[11px] text-white/35 mt-0.5">AMCAS / TMDSAS-ready entry</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* Duplicate warning */}
        {duplicates.length > 0 && (
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-300">Possible duplicate detected</p>
              <p className="text-[11px] text-amber-400/70 mt-0.5">
                Similar to: <span className="font-medium">{duplicates[0].name}</span> at {duplicates[0].organization}
              </p>
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className={labelClass}>Activity Name *</label>
          <input
            className={fieldClass}
            placeholder="e.g. Emergency Department Volunteer"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Category *</label>
          <div className="relative">
            <select
              className={`${fieldClass} appearance-none pr-8 cursor-pointer`}
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as Category })}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Organization */}
        <div>
          <label className={labelClass}>Organization *</label>
          <input
            className={fieldClass}
            placeholder="e.g. Dell Seton Medical Center"
            value={form.organization}
            onChange={e => setForm({ ...form, organization: e.target.value })}
          />
        </div>

        {/* Date range + Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Start Date *</label>
            <input type="date" className={fieldClass} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input type="date" className={fieldClass} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Total Hours *</label>
          <input
            type="number"
            className={fieldClass}
            placeholder="0"
            min={0}
            value={form.hours}
            onChange={e => setForm({ ...form, hours: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass.replace("mb-1.5", "")}>Description</label>
            <span className={`text-[11px] font-mono ${form.description.length > 650 ? "text-amber-400" : "text-white/25"}`}>
              {form.description.length}/700
            </span>
          </div>
          <textarea
            className={`${fieldClass} resize-none`}
            rows={5}
            placeholder="Describe your role, responsibilities, and what you learned..."
            maxLength={700}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <p className="text-[11px] text-white/20 mt-1">AMCAS 700-char limit applied automatically</p>
        </div>

        {/* Most Meaningful toggle */}
        <div className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-colors ${
          form.mostMeaningful
            ? "bg-[#BF5700]/10 border-[#BF5700]/30"
            : "bg-white/[0.03] border-white/[0.07] hover:border-white/15"
        }`}>
          <div>
            <div className="flex items-center gap-1.5">
              <Star size={12} className={form.mostMeaningful ? "text-[#BF5700] fill-[#BF5700]" : "text-white/30"} />
              <span className="text-xs font-semibold text-white/80">Most Meaningful</span>
            </div>
            <p className="text-[11px] text-white/35 mt-1 leading-relaxed">
              AMCAS allows 3 most meaningful activities.{" "}
              {!canAddMeaningful && !form.mostMeaningful && (
                <span className="text-amber-400">You&apos;ve already selected 3.</span>
              )}
              {canAddMeaningful && (
                <span className="text-white/25">{3 - meaningfulCount} slot{3 - meaningfulCount !== 1 ? "s" : ""} remaining.</span>
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={!canAddMeaningful && !form.mostMeaningful}
            onClick={() => setForm({ ...form, mostMeaningful: !form.mostMeaningful })}
            className={`shrink-0 w-10 h-6 rounded-full transition-all duration-200 relative ${
              form.mostMeaningful ? "bg-[#BF5700]" : "bg-white/[0.08]"
            } disabled:opacity-40`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
              form.mostMeaningful ? "left-[calc(100%-1.25rem-2px)]" : "left-0.5"
            }`} />
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-between gap-3 shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!isValid}
          className="flex items-center gap-2 px-5 py-2 bg-[#BF5700] text-white text-sm font-medium rounded-lg hover:bg-[#d46200] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={15} />
          Log Activity
        </button>
      </div>
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1628] border border-white/[0.10] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[11px] text-white/40 font-mono mb-2">{label}</p>
      {payload.slice().reverse().map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[11px] text-white/60">{p.name}</span>
          <span className="text-[11px] font-mono text-white ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityItem[]>(SEED_ACTIVITIES);
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState<Category | "All">("All");
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [sortCol,    setSortCol]    = useState<"name" | "hours" | "date">("date");
  const [sortDir,    setSortDir]    = useState<"asc" | "desc">("desc");

  // Derived values
  const meaningfulCount = useMemo(() => activities.filter(a => a.mostMeaningful).length, [activities]);
  const meaningfulActs  = useMemo(() => activities.filter(a => a.mostMeaningful).slice(0, 3), [activities]);

  const totalsByCategory = useMemo(() => {
    const acc = {} as Record<Category, number>;
    CATEGORIES.forEach(c => { acc[c] = 0; });
    activities.forEach(a => { acc[a.category] = (acc[a.category] ?? 0) + a.hours; });
    return acc;
  }, [activities]);

  const totalHours = useMemo(() => activities.reduce((s, a) => s + a.hours, 0), [activities]);

  const filtered = useMemo(() => {
    let list = activities;
    if (filterCat !== "All") list = list.filter(a => a.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.organization.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name")  cmp = a.name.localeCompare(b.name);
      if (sortCol === "hours") cmp = a.hours - b.hours;
      if (sortCol === "date")  cmp = a.startDate.localeCompare(b.startDate);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [activities, filterCat, search, sortCol, sortDir]);

  function handleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  function openSheet() {
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  }

  function submitActivity() {
    if (!form.name.trim() || !form.hours) return;
    const newAct: ActivityItem = {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category,
      hours: parseFloat(form.hours) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      organization: form.organization.trim(),
      description: form.description.trim(),
      mostMeaningful: form.mostMeaningful,
    };
    setActivities(prev => [newAct, ...prev]);
    setSheetOpen(false);
    setForm(EMPTY_FORM);
  }

  function SortIndicator({ col }: { col: typeof sortCol }) {
    if (sortCol !== col) return <span className="text-white/15 ml-1">↕</span>;
    return <span className="text-[#BF5700] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="min-h-full bg-[#0F172A]">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Activities</h1>
            <p className="text-sm text-white/35 mt-0.5">
              {activities.length} logged · <span className="font-mono text-white/50">{totalHours.toLocaleString()} total hours</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 rounded-lg hover:bg-white/[0.08] hover:text-white/80 transition-colors"
            >
              <Download size={14} />
              Export
            </button>
            <button
              onClick={openSheet}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#BF5700] text-white text-sm font-medium rounded-lg hover:bg-[#d46200] transition-colors"
            >
              <Plus size={15} />
              Add Activity
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-5 pb-8">

        {/* ── Summary Stats Bar ── */}
        <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => (
            <StatBar key={cat} cat={cat} hours={totalsByCategory[cat]} />
          ))}
        </div>

        {/* ── Most Meaningful + Chart Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

          {/* Most Meaningful */}
          <div className="xl:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Star size={13} className="text-[#BF5700] fill-[#BF5700]" />
              <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-white/50">
                Most Meaningful
              </h2>
              <span className="text-[11px] font-mono text-white/25 ml-auto">
                {meaningfulCount}/3 used
              </span>
            </div>
            {meaningfulActs.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center">
                <Star size={20} className="text-white/15" />
                <p className="text-xs text-white/30">Mark up to 3 activities as most meaningful</p>
              </div>
            ) : (
              meaningfulActs.map(a => <MeaningfulCard key={a.id} activity={a} />)
            )}
          </div>

          {/* Hours Over Time Chart */}
          <div className="xl:col-span-3 bg-white/[0.04] border border-white/[0.07] rounded-xl p-5 hover:border-white/15 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-white/50">Hours Over Time</h2>
                <p className="text-[11px] text-white/25 mt-0.5">Cumulative by category</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  {CATEGORIES.filter(c => c !== "Other").map(c => (
                    <linearGradient key={c} id={`grad-${c}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CAT_CFG[c].color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={CAT_CFG[c].color} stopOpacity={0.0}  />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {(["Clinical", "Research", "Volunteering", "Shadowing", "Leadership"] as Category[]).map(c => (
                  <Area
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stackId="1"
                    stroke={CAT_CFG[c].color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${c})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-white/[0.05]">
              {(["Clinical", "Research", "Volunteering", "Shadowing", "Leadership"] as Category[]).map(c => (
                <div key={c} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: CAT_CFG[c].color }} />
                  <span className="text-[10px] text-white/35">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Activities Table ── */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
          {/* Table controls */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#BF5700]/40 transition-colors"
                placeholder="Search activities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterCat("All")}
                className={`shrink-0 px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                  filterCat === "All"
                    ? "bg-[#BF5700]/15 border-[#BF5700]/35 text-[#BF5700]"
                    : "bg-white/[0.03] border-white/[0.07] text-white/35 hover:text-white/60"
                }`}
              >
                All ({activities.length})
              </button>
              {CATEGORIES.map(c => {
                const count = activities.filter(a => a.category === c).length;
                if (count === 0) return null;
                const cfg = CAT_CFG[c];
                return (
                  <button
                    key={c}
                    onClick={() => setFilterCat(filterCat === c ? "All" : c)}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                      filterCat === c
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : "bg-white/[0.03] border-white/[0.07] text-white/35 hover:text-white/60"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                    {c} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium tracking-[0.12em] uppercase text-white/25">
                    <button onClick={() => handleSort("name")} className="hover:text-white/50 transition-colors flex items-center">
                      Activity <SortIndicator col="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium tracking-[0.12em] uppercase text-white/25">Category</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-medium tracking-[0.12em] uppercase text-white/25">
                    <button onClick={() => handleSort("hours")} className="hover:text-white/50 transition-colors flex items-center ml-auto">
                      Hours <SortIndicator col="hours" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium tracking-[0.12em] uppercase text-white/25">
                    <button onClick={() => handleSort("date")} className="hover:text-white/50 transition-colors flex items-center">
                      Date Range <SortIndicator col="date" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium tracking-[0.12em] uppercase text-white/25 hidden lg:table-cell">Organization</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium tracking-[0.12em] uppercase text-white/25 hidden xl:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-white/25">
                      No activities match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, i) => (
                    <tr
                      key={a.id}
                      className={`group border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-default ${
                        i === filtered.length - 1 ? "border-0" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {a.mostMeaningful && (
                            <Star size={11} className="text-[#BF5700] fill-[#BF5700] shrink-0" />
                          )}
                          <span className="text-sm text-white/80 font-medium leading-snug">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CatBadge cat={a.category} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-white/70">{a.hours.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-white/35 font-mono whitespace-nowrap">
                          {fmtDate(a.startDate)} – {a.endDate ? fmtDate(a.endDate) : "Present"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell max-w-[200px]">
                        <span className="text-xs text-white/40 truncate block">{a.organization}</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell max-w-[260px]">
                        <p className="text-xs text-white/30 truncate">{a.description}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[11px] text-white/20">{filtered.length} entr{filtered.length === 1 ? "y" : "ies"}</span>
              <span className="text-[11px] text-white/20 font-mono">
                {filtered.reduce((s, a) => s + a.hours, 0).toLocaleString()} hrs shown
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ── Add Activity Sheet ── */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <AddActivityForm
          form={form}
          setForm={setForm}
          existingActivities={activities}
          meaningfulCount={meaningfulCount}
          onSubmit={submitActivity}
          onClose={() => setSheetOpen(false)}
        />
      </Sheet>

      {/* ── Export Modal ── */}
      {exportOpen && (
        <ExportModal activities={activities} onClose={() => setExportOpen(false)} />
      )}

    </div>
  );
}
