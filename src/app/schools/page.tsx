"use client";

import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  BookmarkPlus,
  MapPin,
  DollarSign,
  Users,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";

// ── Types ─────────────────────────────────────────────────────────────────────

type SchoolType = "MD" | "DO";
type SortDir    = "asc" | "desc" | null;

interface UTOutcomeCell {
  applied:      number;
  interviewed:  number;
  accepted:     number;
}

interface School {
  id:             number;
  name:           string;
  abbr:           string;
  state:          string;
  type:           SchoolType;
  medianGPA:      number;
  medianMCAT:     number;
  acceptanceRate: number; // %
  inStateBias:    "High" | "Moderate" | "Low";
  utAcceptRate:   number | null; // % of UT applicants accepted, null = no data
  tuition:        number; // annual in-state $k
  classSize:      number;
  overview:       string;
  secondaries:    { prompt: string; wordLimit: number | null }[];
  prerequisites:  string[];
  utOutcomes:     Record<string, Record<string, UTOutcomeCell>>; // gpa band → mcat band → cell
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const GPA_BANDS  = ["3.8–4.0", "3.6–3.79", "3.4–3.59", "< 3.4"];
const MCAT_BANDS = ["517–528", "510–516", "500–509", "< 500"];

function mockCell(a: number, i: number, ac: number): UTOutcomeCell {
  return { applied: a, interviewed: i, accepted: ac };
}

const SCHOOLS: School[] = [
  {
    id: 1,
    name: "UT Southwestern Medical School",
    abbr: "UTSW",
    state: "TX",
    type: "MD",
    medianGPA: 3.91,
    medianMCAT: 521,
    acceptanceRate: 4.2,
    inStateBias: "High",
    utAcceptRate: 18,
    tuition: 23,
    classSize: 230,
    overview:
      "UT Southwestern is a flagship Texas research institution consistently ranked top-20. Strong USMLE Step 1 pass rates and excellent residency match outcomes. Heavily favors Texas residents via TMDSAS.",
    secondaries: [
      { prompt: "Describe a challenge you've overcome and what it taught you.", wordLimit: 350 },
      { prompt: "Why UT Southwestern specifically? What draws you to our community?", wordLimit: 300 },
      { prompt: "Discuss your most meaningful research experience.", wordLimit: 400 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Biochemistry", "Physics (2 semesters + lab)", "Math/Statistics", "English (2 semesters)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(12, 9, 7),  "510–516": mockCell(8, 5, 3),  "500–509": mockCell(4, 1, 0),  "< 500": mockCell(1, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(10, 6, 3),  "510–516": mockCell(9, 4, 2),  "500–509": mockCell(5, 1, 0),  "< 500": mockCell(2, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(7, 3, 1),   "510–516": mockCell(6, 2, 0),  "500–509": mockCell(3, 0, 0),  "< 500": mockCell(1, 0, 0) },
      "< 3.4":    { "517–528": mockCell(4, 1, 0),   "510–516": mockCell(3, 0, 0),  "500–509": mockCell(2, 0, 0),  "< 500": mockCell(1, 0, 0) },
    },
  },
  {
    id: 2,
    name: "Baylor College of Medicine",
    abbr: "BCM",
    state: "TX",
    type: "MD",
    medianGPA: 3.93,
    medianMCAT: 522,
    acceptanceRate: 3.1,
    inStateBias: "High",
    utAcceptRate: 12,
    tuition: 26,
    classSize: 185,
    overview:
      "Baylor is one of the most selective medical schools in the country and is tuition-free for most students through endowment scholarships. Exceptional research infrastructure and Houston Medical Center affiliation.",
    secondaries: [
      { prompt: "What experiences have shaped your decision to pursue medicine?", wordLimit: 500 },
      { prompt: "Describe a time you navigated a difficult ethical situation.", wordLimit: 400 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "General Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Physics (2 semesters + lab)", "English (2 semesters)", "Calculus or Statistics"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(15, 8, 5),  "510–516": mockCell(10, 4, 2), "500–509": mockCell(5, 1, 0),  "< 500": mockCell(1, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(12, 5, 2),  "510–516": mockCell(8, 3, 1),  "500–509": mockCell(4, 0, 0),  "< 500": mockCell(1, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(6, 2, 0),   "510–516": mockCell(4, 1, 0),  "500–509": mockCell(2, 0, 0),  "< 500": mockCell(0, 0, 0) },
      "< 3.4":    { "517–528": mockCell(3, 0, 0),   "510–516": mockCell(2, 0, 0),  "500–509": mockCell(1, 0, 0),  "< 500": mockCell(0, 0, 0) },
    },
  },
  {
    id: 3,
    name: "Texas A&M College of Medicine",
    abbr: "TAMU",
    state: "TX",
    type: "MD",
    medianGPA: 3.78,
    medianMCAT: 512,
    acceptanceRate: 7.4,
    inStateBias: "High",
    utAcceptRate: 22,
    tuition: 19,
    classSize: 200,
    overview:
      "Texas A&M COM is a strong Texas TMDSAS school with a collaborative culture and rural medicine emphasis. Newer curriculum with early clinical exposure. Strong match rates to primary care and internal medicine.",
    secondaries: [
      { prompt: "Why Texas A&M? What specifically about our mission resonates with you?", wordLimit: 300 },
      { prompt: "Describe a leadership experience and its impact.", wordLimit: 350 },
      { prompt: "How have you contributed to your community?", wordLimit: 350 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (1 semester + lab)", "Biochemistry", "Physics (2 semesters + lab)", "Statistics or Calculus", "English (2 semesters)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(10, 8, 6),  "510–516": mockCell(12, 9, 7),  "500–509": mockCell(6, 4, 2),  "< 500": mockCell(2, 1, 0) },
      "3.6–3.79": { "517–528": mockCell(14, 10, 7), "510–516": mockCell(15, 11, 8), "500–509": mockCell(8, 4, 2),  "< 500": mockCell(3, 1, 0) },
      "3.4–3.59": { "517–528": mockCell(8, 5, 3),   "510–516": mockCell(9, 6, 3),   "500–509": mockCell(5, 2, 1),  "< 500": mockCell(2, 0, 0) },
      "< 3.4":    { "517–528": mockCell(4, 2, 1),   "510–516": mockCell(5, 2, 1),   "500–509": mockCell(3, 1, 0),  "< 500": mockCell(1, 0, 0) },
    },
  },
  {
    id: 4,
    name: "UT Health Houston — McGovern",
    abbr: "UTH",
    state: "TX",
    type: "MD",
    medianGPA: 3.81,
    medianMCAT: 514,
    acceptanceRate: 5.8,
    inStateBias: "High",
    utAcceptRate: 20,
    tuition: 21,
    classSize: 240,
    overview:
      "McGovern Medical School at UTHealth is one of the largest medical schools in the US with exceptional clinical diversity in the Texas Medical Center. Strong primary care pipeline and community health mission.",
    secondaries: [
      { prompt: "Describe how your background will contribute to diversity at McGovern.", wordLimit: 500 },
      { prompt: "What do you see as the most important issue in healthcare today?", wordLimit: 400 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Biochemistry (recommended)", "Physics (2 semesters + lab)", "Math (2 semesters)", "English (2 semesters)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(11, 9, 6),  "510–516": mockCell(13, 10, 7), "500–509": mockCell(7, 4, 2),  "< 500": mockCell(2, 1, 0) },
      "3.6–3.79": { "517–528": mockCell(13, 9, 6),  "510–516": mockCell(16, 11, 8), "500–509": mockCell(9, 5, 2),  "< 500": mockCell(3, 1, 0) },
      "3.4–3.59": { "517–528": mockCell(7, 4, 2),   "510–516": mockCell(10, 6, 3),  "500–509": mockCell(6, 3, 1),  "< 500": mockCell(2, 0, 0) },
      "< 3.4":    { "517–528": mockCell(3, 1, 0),   "510–516": mockCell(4, 2, 1),   "500–509": mockCell(3, 1, 0),  "< 500": mockCell(1, 0, 0) },
    },
  },
  {
    id: 5,
    name: "Mayo Clinic Alix School of Medicine",
    abbr: "MAYO",
    state: "MN",
    type: "MD",
    medianGPA: 3.92,
    medianMCAT: 522,
    acceptanceRate: 1.9,
    inStateBias: "Low",
    utAcceptRate: 4,
    tuition: 62,
    classSize: 56,
    overview:
      "One of the most selective and prestigious medical schools globally. Tiny class size, full-tuition scholarships for most students, and unparalleled clinical exposure at the #1-ranked Mayo Clinic hospital system.",
    secondaries: [
      { prompt: "Describe a time you contributed to a team. What was your role?", wordLimit: 600 },
      { prompt: "Tell us about a patient interaction that shaped your perspective.", wordLimit: 500 },
      { prompt: "What is your greatest weakness?", wordLimit: 300 },
    ],
    prerequisites: ["Biology (with lab)", "Chemistry (with lab)", "Organic Chemistry (with lab)", "Biochemistry", "Physics (with lab)", "Statistics", "Writing-intensive course"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(8, 3, 1),  "510–516": mockCell(5, 1, 0),  "500–509": mockCell(2, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(6, 1, 0),  "510–516": mockCell(4, 0, 0),  "500–509": mockCell(1, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(3, 0, 0),  "510–516": mockCell(2, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
      "< 3.4":    { "517–528": mockCell(1, 0, 0),  "510–516": mockCell(0, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
    },
  },
  {
    id: 6,
    name: "Johns Hopkins School of Medicine",
    abbr: "JHU",
    state: "MD",
    type: "MD",
    medianGPA: 3.94,
    medianMCAT: 523,
    acceptanceRate: 2.8,
    inStateBias: "Low",
    utAcceptRate: 5,
    tuition: 58,
    classSize: 120,
    overview:
      "Johns Hopkins consistently ranks #1-3 in research and is a pinnacle of academic medicine. Exceptionally selective; expects NIH-level research productivity and strong humanitarian narrative. Nearly full financial aid.",
    secondaries: [
      { prompt: "Describe your most significant research contribution.", wordLimit: null },
      { prompt: "How have your experiences prepared you for a career in academic medicine?", wordLimit: null },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Physics (2 semesters + lab)", "Biochemistry", "Math (1 semester)", "Writing (1 semester)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(6, 2, 1),  "510–516": mockCell(4, 1, 0),  "500–509": mockCell(1, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(5, 1, 0),  "510–516": mockCell(3, 0, 0),  "500–509": mockCell(1, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(2, 0, 0),  "510–516": mockCell(1, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
      "< 3.4":    { "517–528": mockCell(1, 0, 0),  "510–516": mockCell(0, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
    },
  },
  {
    id: 7,
    name: "Texas College of Osteopathic Medicine",
    abbr: "TCOM",
    state: "TX",
    type: "DO",
    medianGPA: 3.64,
    medianMCAT: 505,
    acceptanceRate: 11.2,
    inStateBias: "High",
    utAcceptRate: 28,
    tuition: 17,
    classSize: 175,
    overview:
      "TCOM at UNT Health Science Center is the only public osteopathic school in Texas and one of the most affordable DO programs in the country. Strong primary care focus, excellent rural health training, and Texas-friendly AACOMAS pathway.",
    secondaries: [
      { prompt: "Why osteopathic medicine? Describe what drew you to the DO philosophy.", wordLimit: 500 },
      { prompt: "Tell us about a meaningful community service experience.", wordLimit: 400 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Biochemistry (recommended)", "Physics (2 semesters + lab)", "English (2 semesters)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(5, 4, 3),  "510–516": mockCell(7, 6, 5),  "500–509": mockCell(8, 7, 5), "< 500": mockCell(3, 2, 1) },
      "3.6–3.79": { "517–528": mockCell(8, 7, 5),  "510–516": mockCell(12, 10, 8), "500–509": mockCell(9, 7, 5), "< 500": mockCell(4, 3, 2) },
      "3.4–3.59": { "517–528": mockCell(6, 5, 3),  "510–516": mockCell(9, 7, 5),  "500–509": mockCell(8, 6, 4), "< 500": mockCell(4, 2, 1) },
      "< 3.4":    { "517–528": mockCell(3, 2, 1),  "510–516": mockCell(5, 3, 2),  "500–509": mockCell(6, 4, 2), "< 500": mockCell(3, 1, 0) },
    },
  },
  {
    id: 8,
    name: "University of Michigan Medical School",
    abbr: "UMICH",
    state: "MI",
    type: "MD",
    medianGPA: 3.88,
    medianMCAT: 518,
    acceptanceRate: 5.3,
    inStateBias: "Moderate",
    utAcceptRate: 7,
    tuition: 37,
    classSize: 170,
    overview:
      "University of Michigan is a top-10 research powerhouse with an extremely collaborative curriculum. The Preclerkship program is pass/fail. Strong residency matching across all specialties. Beautiful campus environment.",
    secondaries: [
      { prompt: "Describe a situation where you had to adapt to a difficult circumstance.", wordLimit: 400 },
      { prompt: "What do you hope to contribute to the Michigan medical community?", wordLimit: 400 },
      { prompt: "Tell us about a mentor who influenced your path.", wordLimit: 350 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Biochemistry", "Physics (2 semesters + lab)", "Statistics", "Writing-intensive courses (2)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(7, 4, 2),  "510–516": mockCell(5, 2, 1),  "500–509": mockCell(2, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(6, 3, 1),  "510–516": mockCell(5, 2, 0),  "500–509": mockCell(2, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(3, 1, 0),  "510–516": mockCell(3, 1, 0),  "500–509": mockCell(1, 0, 0), "< 500": mockCell(0, 0, 0) },
      "< 3.4":    { "517–528": mockCell(1, 0, 0),  "510–516": mockCell(1, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
    },
  },
];

// ── Sort helpers ──────────────────────────────────────────────────────────────

type SortKey = "name" | "type" | "medianGPA" | "medianMCAT" | "acceptanceRate" | "inStateBias" | "utAcceptRate";

const BIAS_ORDER: Record<string, number> = { High: 3, Moderate: 2, Low: 1 };

function getValue(s: School, key: SortKey): number | string {
  if (key === "inStateBias") return BIAS_ORDER[s.inStateBias];
  if (key === "utAcceptRate") return s.utAcceptRate ?? -1;
  return s[key];
}

// ── Heatmap cell ──────────────────────────────────────────────────────────────

function heatColor(accepted: number, applied: number): string {
  if (applied === 0 || accepted === 0) return "rgba(255,255,255,0.04)";
  const rate = accepted / applied;
  if (rate >= 0.5) return "rgba(191,87,0,0.70)";
  if (rate >= 0.3) return "rgba(191,87,0,0.45)";
  if (rate >= 0.1) return "rgba(191,87,0,0.22)";
  return "rgba(191,87,0,0.08)";
}

// ── In-State Bias badge ───────────────────────────────────────────────────────

function BiasBadge({ bias }: { bias: School["inStateBias"] }) {
  const cfg = {
    High:     "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Moderate: "text-amber-400   bg-amber-500/10   border-amber-500/20",
    Low:      "text-white/40    bg-white/5         border-white/10",
  }[bias];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cfg}`}>
      {bias}
    </span>
  );
}

// ── Drawer tabs ───────────────────────────────────────────────────────────────

type DrawerTab = "Overview" | "UT Outcomes" | "Secondaries" | "Prerequisites";
const DRAWER_TABS: DrawerTab[] = ["Overview", "UT Outcomes", "Secondaries", "Prerequisites"];

function SchoolDrawer({ school, onClose }: { school: School | null; onClose: () => void }) {
  const [tab, setTab] = useState<DrawerTab>("Overview");

  // Reset tab when school changes
  const [prevId, setPrevId] = useState<number | null>(null);
  if (school && school.id !== prevId) {
    setPrevId(school.id);
    setTab("Overview");
  }

  return (
    <Sheet open={!!school} onClose={onClose}>
      {school && (
        <div className="flex flex-col h-full">
          {/* Drawer header */}
          <div className="p-6 pb-0 border-b border-white/10 pr-12">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                school.type === "MD"
                  ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
                  : "text-violet-400 bg-violet-500/10 border-violet-500/20"
              }`}>
                {school.type}
              </span>
              <span className="text-[11px] text-white/30 font-mono">{school.state}</span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{school.name}</h2>

            {/* Stat strip */}
            <div className="flex gap-4 mt-3 mb-4">
              {[
                { label: "Median GPA",  value: school.medianGPA.toFixed(2) },
                { label: "Median MCAT", value: school.medianMCAT.toString() },
                { label: "Acceptance",  value: school.acceptanceRate + "%" },
                { label: "Class Size",  value: school.classSize.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="font-mono text-sm font-bold text-white">{value}</p>
                  <p className="text-[10px] text-white/30">{label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              {DRAWER_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    tab === t
                      ? "border-[#BF5700] text-[#BF5700]"
                      : "border-transparent text-white/35 hover:text-white/60"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tab body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {tab === "Overview" && (
              <>
                <p className="text-sm text-white/60 leading-relaxed">{school.overview}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3 flex items-center gap-3">
                    <DollarSign size={14} className="text-[#BF5700] shrink-0" />
                    <div>
                      <p className="font-mono text-sm font-semibold text-white">${school.tuition}k/yr</p>
                      <p className="text-[10px] text-white/30">In-state tuition</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3 flex items-center gap-3">
                    <Users size={14} className="text-[#BF5700] shrink-0" />
                    <div>
                      <p className="font-mono text-sm font-semibold text-white">{school.classSize}</p>
                      <p className="text-[10px] text-white/30">Class size</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3 flex items-center gap-3">
                    <MapPin size={14} className="text-[#BF5700] shrink-0" />
                    <div>
                      <p className="font-mono text-sm font-semibold text-white">{school.state}</p>
                      <p className="text-[10px] text-white/30">State</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3 flex items-center gap-3">
                    <BookmarkPlus size={14} className="text-[#BF5700] shrink-0" />
                    <div>
                      <p className="font-mono text-sm font-semibold text-white">
                        {school.utAcceptRate != null ? school.utAcceptRate + "%" : "—"}
                      </p>
                      <p className="text-[10px] text-white/30">UT accept rate</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === "UT Outcomes" && (
              <div className="space-y-4">
                <p className="text-xs text-white/40 leading-relaxed">
                  UT Austin applicant outcomes by GPA × MCAT band. Data from HPO reports 2021–2023.
                  Cell = applied / interviewed / <span className="text-[#BF5700]">accepted</span>.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left py-2 pr-4 text-white/30 font-medium w-24">GPA \ MCAT</th>
                        {MCAT_BANDS.map((b) => (
                          <th key={b} className="text-center py-2 px-1 text-white/40 font-mono font-medium">{b}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {GPA_BANDS.map((gpaBand) => (
                        <tr key={gpaBand}>
                          <td className="py-1.5 pr-4 text-white/40 font-mono">{gpaBand}</td>
                          {MCAT_BANDS.map((mcatBand) => {
                            const cell = school.utOutcomes[gpaBand]?.[mcatBand] ?? { applied: 0, interviewed: 0, accepted: 0 };
                            return (
                              <td key={mcatBand} className="py-1 px-1">
                                <div
                                  className="rounded-md p-2 text-center min-w-[72px]"
                                  style={{ backgroundColor: heatColor(cell.accepted, cell.applied) }}
                                >
                                  {cell.applied === 0 ? (
                                    <span className="text-white/15">—</span>
                                  ) : (
                                    <div className="space-y-0.5">
                                      <p className="text-white/50">{cell.applied} / {cell.interviewed}</p>
                                      <p className="font-bold text-[#BF5700]">{cell.accepted}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-[10px] text-white/30">Acceptance rate intensity:</span>
                  {[
                    { label: "0%",    color: "rgba(191,87,0,0.08)" },
                    { label: "10%+",  color: "rgba(191,87,0,0.22)" },
                    { label: "30%+",  color: "rgba(191,87,0,0.45)" },
                    { label: "50%+",  color: "rgba(191,87,0,0.70)" },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                      <span className="text-[10px] text-white/30">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Secondaries" && (
              <div className="space-y-3">
                {school.secondaries.length === 0 ? (
                  <p className="text-sm text-white/30">No secondary prompts on record.</p>
                ) : (
                  school.secondaries.map((s, i) => (
                    <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-2">
                      <p className="text-sm text-white/75 leading-relaxed">{s.prompt}</p>
                      <p className="text-[11px] text-white/30">
                        {s.wordLimit != null ? `Word limit: ${s.wordLimit}` : "No word limit specified"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "Prerequisites" && (
              <ul className="space-y-2">
                {school.prerequisites.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-white/55">
                    <span className="mt-2 w-1 h-1 rounded-full bg-[#BF5700]/60 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className = "",
}: {
  label:      string;
  sortKey:    SortKey;
  currentKey: SortKey | null;
  currentDir: SortDir;
  onSort:     (k: SortKey) => void;
  className?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className={`px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase">
        <span className={active ? "text-[#BF5700]" : "text-white/35"}>{label}</span>
        {active ? (
          currentDir === "asc" ? <ChevronUp size={12} className="text-[#BF5700]" /> : <ChevronDown size={12} className="text-[#BF5700]" />
        ) : (
          <ChevronsUpDown size={11} className="text-white/20" />
        )}
      </span>
    </th>
  );
}

// ── Range slider ──────────────────────────────────────────────────────────────

function RangeFilter({
  label, min, max, value, onChange, step = 1,
}: {
  label:    string;
  min:      number;
  max:      number;
  value:    [number, number];
  onChange: (v: [number, number]) => void;
  step?:    number;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/30">{label}</span>
        <span className="text-[10px] font-mono text-white/40">{value[0]} – {value[1]}</span>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="range" min={min} max={max} step={step} value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= value[1]) onChange([v, value[1]]);
          }}
          className="w-full accent-[#BF5700] h-1 bg-white/10 rounded appearance-none cursor-pointer"
        />
        <input
          type="range" min={min} max={max} step={step} value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= value[0]) onChange([value[0], v]);
          }}
          className="w-full accent-[#BF5700] h-1 bg-white/10 rounded appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  const [selected,    setSelected]    = useState<School | null>(null);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<"All" | "MD" | "DO">("All");
  const [stateFilter, setStateFilter] = useState<"All" | "In-State" | "Out-of-State">("All");
  const [gpaRange,    setGpaRange]    = useState<[number, number]>([3.0, 4.0]);
  const [mcatRange,   setMcatRange]   = useState<[number, number]>([495, 528]);
  const [sortKey,     setSortKey]     = useState<SortKey | null>(null);
  const [sortDir,     setSortDir]     = useState<SortDir>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === "asc")  { setSortDir("desc"); return; }
      if (sortDir === "desc") { setSortKey(null); setSortDir(null); return; }
    }
    setSortKey(key);
    setSortDir("asc");
  }

  const rows = useMemo(() => {
    let list = SCHOOLS.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.abbr.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "All" && s.type !== typeFilter) return false;
      if (stateFilter === "In-State"     && s.state !== "TX") return false;
      if (stateFilter === "Out-of-State" && s.state === "TX") return false;
      if (s.medianGPA  < gpaRange[0]  || s.medianGPA  > gpaRange[1])  return false;
      if (s.medianMCAT < mcatRange[0] || s.medianMCAT > mcatRange[1]) return false;
      return true;
    });

    if (sortKey && sortDir) {
      list = [...list].sort((a, b) => {
        const av = getValue(a, sortKey);
        const bv = getValue(b, sortKey);
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [search, typeFilter, stateFilter, gpaRange, mcatRange, sortKey, sortDir]);

  return (
    <div className="min-h-full bg-[#0F172A] flex flex-col">

      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">School Explorer</h1>
            <p className="text-sm text-white/35 mt-0.5">
              {rows.length} of {SCHOOLS.length} schools · Click any row for details
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              type="text"
              placeholder="Search schools…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#BF5700]/50 w-56 transition-colors"
            />
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-5">
          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/30">Type</span>
            <div className="flex gap-1">
              {(["All", "MD", "DO"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    typeFilter === t
                      ? "bg-[#BF5700]/20 border-[#BF5700]/40 text-[#BF5700]"
                      : "bg-white/[0.04] border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* State */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/30">Location</span>
            <div className="flex gap-1">
              {(["All", "In-State", "Out-of-State"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStateFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    stateFilter === s
                      ? "bg-[#BF5700]/20 border-[#BF5700]/40 text-[#BF5700]"
                      : "bg-white/[0.04] border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* GPA range */}
          <RangeFilter
            label="GPA Range"
            min={2.5} max={4.0} step={0.05}
            value={gpaRange}
            onChange={setGpaRange}
          />

          {/* MCAT range */}
          <RangeFilter
            label="MCAT Range"
            min={472} max={528} step={1}
            value={mcatRange}
            onChange={setMcatRange}
          />

          {/* Clear */}
          {(typeFilter !== "All" || stateFilter !== "All" || gpaRange[0] !== 3.0 || gpaRange[1] !== 4.0 || mcatRange[0] !== 495 || mcatRange[1] !== 528) && (
            <button
              onClick={() => { setTypeFilter("All"); setStateFilter("All"); setGpaRange([3.0, 4.0]); setMcatRange([495, 528]); }}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors pb-1"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-[#0A1120]">
            <tr className="border-b border-white/10">
              <ColHeader label="School"          sortKey="name"           currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="pl-6 w-64" />
              <ColHeader label="Type"            sortKey="type"           currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <ColHeader label="Median GPA"      sortKey="medianGPA"      currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <ColHeader label="Median MCAT"     sortKey="medianMCAT"     currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <ColHeader label="Acceptance %"    sortKey="acceptanceRate" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <ColHeader label="In-State Bias"   sortKey="inStateBias"    currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <ColHeader label="UT Accept Rate"  sortKey="utAcceptRate"   currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="pr-6" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-white/25 text-sm">
                  No schools match your filters.
                </td>
              </tr>
            ) : (
              rows.map((school, i) => (
                <tr
                  key={school.id}
                  onClick={() => setSelected(school)}
                  className={`border-b border-white/[0.05] cursor-pointer transition-colors hover:bg-[#BF5700]/[0.06] ${
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"
                  }`}
                >
                  <td className="px-4 py-3 pl-6">
                    <div>
                      <p className="text-sm font-medium text-white/85">{school.name}</p>
                      <p className="text-[11px] text-white/30 mt-0.5 font-mono">{school.abbr} · {school.state}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                      school.type === "MD"
                        ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
                        : "text-violet-400 bg-violet-500/10 border-violet-500/20"
                    }`}>
                      {school.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white/70 tabular-nums">
                    {school.medianGPA.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white/70 tabular-nums">
                    {school.medianMCAT}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white/70 tabular-nums">
                    {school.acceptanceRate}%
                  </td>
                  <td className="px-4 py-3">
                    <BiasBadge bias={school.inStateBias} />
                  </td>
                  <td className="px-4 py-3 pr-6 font-mono text-sm tabular-nums">
                    {school.utAcceptRate != null
                      ? <span className="text-[#BF5700]">{school.utAcceptRate}%</span>
                      : <span className="text-white/20">—</span>
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SchoolDrawer school={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
