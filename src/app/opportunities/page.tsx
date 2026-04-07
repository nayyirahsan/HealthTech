"use client";

import { useState, useMemo } from "react";
import {
  MapPin,
  Clock,
  Star,
  TrendingUp,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category     = "Clinical" | "Research" | "Volunteering" | "Shadowing" | "Leadership";
type Mode         = "In-Person" | "Remote" | "Hybrid";
type Affiliation  = "UT-Affiliated" | "Community";
type Metric       = "Clinical Hours" | "Research Hours" | "Volunteer Hours" | "Shadowing Hours" | "GPA" | "MCAT";

interface Opportunity {
  id:           number;
  name:         string;
  org:          string;
  category:     Category;
  mode:         Mode;
  affiliation:  Affiliation;
  location:     string;
  weeklyHours:  number;
  metric:       Metric;
  competitive:  number; // 1–5
  description:  string;
  requirements: string[];
  applyUrl:     string;
  recommended?: boolean;
  recommendReason?: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

// User gaps (mirrors ut-benchmarks mock data)
// Clinical: −350 hrs, Research: −200 hrs, Volunteer: −70 hrs, Shadowing: −30 hrs
const OPPORTUNITIES: Opportunity[] = [
  {
    id: 1,
    name:         "Dell Seton Medical Center Volunteer",
    org:          "Ascension Seton",
    category:     "Clinical",
    mode:         "In-Person",
    affiliation:  "Community",
    location:     "Austin, TX",
    weeklyHours:  6,
    metric:       "Clinical Hours",
    competitive:  2,
    description:  "Provide direct patient support on medical/surgical floors, assist nursing staff, and transport patients. One of the highest-volume clinical volunteer programs in Austin with direct patient contact from day one.",
    requirements: ["18+ years old", "Background check", "TB test", "8-week orientation"],
    applyUrl:     "https://www.ascension.org",
    recommended:  true,
    recommendReason: "You're 350 clinical hours below the UT median. This adds ~6 hrs/week with direct patient contact.",
  },
  {
    id: 2,
    name:         "UT Austin Undergraduate Research Apprentice Program",
    org:          "UT Austin Office of Undergraduate Research",
    category:     "Research",
    mode:         "In-Person",
    affiliation:  "UT-Affiliated",
    location:     "Austin, TX",
    weeklyHours:  10,
    metric:       "Research Hours",
    competitive:  3,
    description:  "Pair with a faculty research mentor for a semester-long project. Counts toward Bridging Disciplines Program certification. Strong pathway to authorship and recommendation letters from faculty PIs.",
    requirements: ["2.0+ GPA", "Enrolled UT student", "Faculty mentor agreement"],
    applyUrl:     "https://ugs.utexas.edu/ura",
    recommended:  true,
    recommendReason: "You're 200 research hours below median. 10 hrs/week closes that gap within a semester.",
  },
  {
    id: 3,
    name:         "CommUnity Care Health Centers Patient Navigator",
    org:          "CommUnity Care",
    category:     "Volunteering",
    mode:         "In-Person",
    affiliation:  "Community",
    location:     "Austin, TX",
    weeklyHours:  4,
    metric:       "Volunteer Hours",
    competitive:  2,
    description:  "Help underserved patients navigate appointments, insurance, and follow-up care at FQHC clinics. Strong community health focus valued by mission-driven medical schools. Bilingual volunteers especially needed.",
    requirements: ["HIPAA training", "Reliable transportation"],
    applyUrl:     "https://communitycaretx.org",
    recommended:  true,
    recommendReason: "You're 70 volunteer hours behind median. Community health work strengthens your mission alignment narrative.",
  },
  {
    id: 4,
    name:         "UT Health Austin Physician Shadowing Program",
    org:          "UT Health Austin",
    category:     "Shadowing",
    mode:         "In-Person",
    affiliation:  "UT-Affiliated",
    location:     "Austin, TX",
    weeklyHours:  3,
    metric:       "Shadowing Hours",
    competitive:  3,
    description:  "Structured shadowing rotations across 12 specialty departments. Each rotation is 4 weeks. Participants receive a formal evaluation letter from their attending physician, which can be attached to AMCAS.",
    requirements: ["Junior or Senior standing", "Premed advisor signature", "Minimum 2.8 science GPA"],
    applyUrl:     "https://uthealth.utexas.edu",
    recommended:  false,
  },
  {
    id: 5,
    name:         "UT Biomedical Engineering Lab — Undergraduate RA",
    org:          "UT BME Department",
    category:     "Research",
    mode:         "In-Person",
    affiliation:  "UT-Affiliated",
    location:     "Austin, TX",
    weeklyHours:  12,
    metric:       "Research Hours",
    competitive:  4,
    description:  "Full research assistant position in active BME labs. Projects span tissue engineering, neural interfaces, and medical devices. Strong candidates can co-author on publications within 2 semesters.",
    requirements: ["BME, Biology, or Chemistry major preferred", "Prior lab coursework", "Faculty interview"],
    applyUrl:     "https://bme.utexas.edu",
    recommended:  false,
  },
  {
    id: 6,
    name:         "Austin Free Clinic Intake Volunteer",
    org:          "Austin Free Clinic",
    category:     "Clinical",
    mode:         "In-Person",
    affiliation:  "Community",
    location:     "Austin, TX",
    weeklyHours:  3,
    metric:       "Clinical Hours",
    competitive:  1,
    description:  "Staff intake desks, take vital signs, and assist physicians at a free clinic serving uninsured Austin residents. Friday evenings only. Extremely accessible for undergrads — no prior clinical experience required.",
    requirements: ["CPR certification", "Weekly Friday evening availability"],
    applyUrl:     "https://austinfreeclinic.org",
    recommended:  false,
  },
  {
    id: 7,
    name:         "Virtual Medical Scribe — ScribeAmerica",
    org:          "ScribeAmerica",
    category:     "Clinical",
    mode:         "Remote",
    affiliation:  "Community",
    location:     "Remote",
    weeklyHours:  8,
    metric:       "Clinical Hours",
    competitive:  2,
    description:  "Document patient encounters in real time alongside physicians via telehealth platforms. Counts as clinical experience and builds EHR literacy. Paid position — $10–12/hr. Flexible scheduling around classes.",
    requirements: ["WPM 60+", "HIPAA certification", "Own computer + stable internet"],
    applyUrl:     "https://www.scribeamerica.com",
    recommended:  false,
  },
  {
    id: 8,
    name:         "UT Longhorn Pre-Med Society — Officer",
    org:          "UT Austin LPM",
    category:     "Leadership",
    mode:         "In-Person",
    affiliation:  "UT-Affiliated",
    location:     "Austin, TX",
    weeklyHours:  5,
    metric:       "Volunteer Hours",
    competitive:  3,
    description:  "Officer positions in event planning, mentorship, or community outreach. Demonstrates leadership and organizational skills. Attending physicians and deans are aware of LPM — name recognition on applications.",
    requirements: ["Active LPM member for 1+ semester", "Run in spring elections"],
    applyUrl:     "https://www.utlpm.org",
    recommended:  false,
  },
  {
    id: 9,
    name:         "St. David's Hospital — Emergency Department Volunteer",
    org:          "St. David's HealthCare",
    category:     "Clinical",
    mode:         "In-Person",
    affiliation:  "Community",
    location:     "Austin, TX",
    weeklyHours:  4,
    metric:       "Clinical Hours",
    competitive:  2,
    description:  "High-acuity ED environment with direct patient exposure. Volunteers assist nursing staff, transport patients, stock supplies, and provide comfort rounding. Some of the most meaningful clinical experience available.",
    requirements: ["Background check", "Physical exam", "2-shift/month minimum commitment"],
    applyUrl:     "https://stdavids.com",
    recommended:  false,
  },
  {
    id: 10,
    name:         "Mano Amiga Education — Tutoring Coordinator",
    org:          "Mano Amiga",
    category:     "Leadership",
    mode:         "Hybrid",
    affiliation:  "Community",
    location:     "Austin, TX",
    weeklyHours:  4,
    metric:       "Volunteer Hours",
    competitive:  2,
    description:  "Coordinate volunteer tutors serving first-generation college students in East Austin. Builds cultural competency, community health awareness, and leadership skills valued by medical schools with social mission focus.",
    requirements: ["Bilingual (Spanish) preferred", "Own transportation"],
    applyUrl:     "https://manoamiga.org",
    recommended:  false,
  },
];

// ── Config maps ───────────────────────────────────────────────────────────────

const CATEGORY_CFG: Record<Category, { color: string; bg: string; border: string }> = {
  Clinical:    { color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
  Research:    { color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20"  },
  Volunteering:{ color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  Shadowing:   { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  Leadership:  { color: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-pink-500/20"    },
};

const MODE_CFG: Record<Mode, string> = {
  "In-Person": "text-white/50",
  "Remote":    "text-[#BF5700]",
  "Hybrid":    "text-white/50",
};

const CATEGORIES: Category[]    = ["Clinical", "Research", "Volunteering", "Shadowing", "Leadership"];
const TIME_OPTIONS               = ["Any", "1–4 hrs/wk", "5–8 hrs/wk", "9+ hrs/wk"];
const MODE_OPTIONS: Mode[]       = ["In-Person", "Remote", "Hybrid"];
const AFFIL_OPTIONS: Affiliation[]= ["UT-Affiliated", "Community"];

// ── Sub-components ────────────────────────────────────────────────────────────

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < value ? "text-[#BF5700] fill-[#BF5700]" : "text-white/15"}
        />
      ))}
    </div>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const cfg = CATEGORY_CFG[category];
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {category}
    </span>
  );
}

function OpportunityCard({
  opp,
  onClick,
}: {
  opp: Opportunity;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-white/25 hover:bg-white/[0.06] transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <CategoryBadge category={opp.category} />
          <h3 className="text-sm font-semibold text-white leading-snug">{opp.name}</h3>
          <p className="text-[11px] text-white/35">{opp.org}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <Stars value={opp.competitive} />
          <span className="text-[10px] text-white/25">competitiveness</span>
        </div>
      </div>

      <p className="text-xs text-white/45 line-clamp-2 leading-relaxed">{opp.description}</p>

      <div className="flex items-center gap-3 pt-1 border-t border-white/[0.06]">
        <span className="flex items-center gap-1 text-[11px] text-white/35">
          <MapPin size={10} className="shrink-0" />
          {opp.location}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-white/35">
          <Clock size={10} className="shrink-0" />
          {opp.weeklyHours} hrs/wk
        </span>
        <span className={`flex items-center gap-1 text-[11px] ml-auto ${MODE_CFG[opp.mode]}`}>
          {opp.mode}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <TrendingUp size={10} className="text-[#BF5700] shrink-0" />
        <span className="text-[10px] text-[#BF5700]/80">Improves {opp.metric}</span>
      </div>
    </button>
  );
}

function OpportunityDrawer({
  opp,
  onClose,
}: {
  opp: Opportunity | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!opp} onClose={onClose}>
      {opp && (
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Drawer header */}
          <div className="p-6 border-b border-white/10 pr-12">
            <CategoryBadge category={opp.category} />
            <h2 className="text-lg font-bold text-white mt-2 leading-snug">{opp.name}</h2>
            <p className="text-sm text-white/40 mt-1">{opp.org}</p>
          </div>

          {/* Drawer body */}
          <div className="flex-1 p-6 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Weekly Hours", value: `${opp.weeklyHours} hrs` },
                { label: "Format",       value: opp.mode                 },
                { label: "Affiliation",  value: opp.affiliation          },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white/[0.04] border border-white/10 rounded-lg p-3 text-center"
                >
                  <p className="font-mono text-sm font-semibold text-white">{value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Competitiveness */}
            <div>
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/35 mb-2">
                Competitiveness
              </p>
              <div className="flex items-center gap-2">
                <Stars value={opp.competitive} />
                <span className="text-xs text-white/35">
                  {["", "Very Easy", "Easy", "Moderate", "Competitive", "Very Competitive"][opp.competitive]}
                </span>
              </div>
            </div>

            {/* Improves */}
            <div>
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/35 mb-2">
                Improves
              </p>
              <div className="flex items-center gap-1.5 text-sm text-[#BF5700]">
                <TrendingUp size={13} />
                {opp.metric}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/35 mb-2">
                About
              </p>
              <p className="text-sm text-white/60 leading-relaxed">{opp.description}</p>
            </div>

            {/* Requirements */}
            <div>
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/35 mb-2">
                Requirements
              </p>
              <ul className="space-y-1.5">
                {opp.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-white/55">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#BF5700]/60 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-white/40">
              <MapPin size={13} className="shrink-0" />
              {opp.location}
            </div>
          </div>

          {/* Drawer footer */}
          <div className="p-6 border-t border-white/10">
            <a
              href={opp.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#BF5700] hover:bg-[#D4620A] text-white text-sm font-semibold transition-colors"
            >
              Apply / Learn More
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? "bg-[#BF5700]/20 border-[#BF5700]/40 text-[#BF5700]"
          : "bg-white/[0.04] border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
      }`}
    >
      {label}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const [selectedOpp,       setSelectedOpp]       = useState<Opportunity | null>(null);
  const [activeCategories,  setActiveCategories]  = useState<Set<Category>>(new Set());
  const [activeTime,        setActiveTime]        = useState("Any");
  const [activeModes,       setActiveModes]       = useState<Set<Mode>>(new Set());
  const [activeAffils,      setActiveAffils]      = useState<Set<Affiliation>>(new Set());

  function toggleSet<T>(set: Set<T>, item: T): Set<T> {
    const next = new Set(set);
    if (next.has(item)) { next.delete(item); } else { next.add(item); }
    return next;
  }

  const filtered = useMemo(() => {
    return OPPORTUNITIES.filter((o) => {
      if (activeCategories.size > 0 && !activeCategories.has(o.category)) return false;
      if (activeModes.size   > 0 && !activeModes.has(o.mode))             return false;
      if (activeAffils.size  > 0 && !activeAffils.has(o.affiliation))     return false;
      if (activeTime !== "Any") {
        const h = o.weeklyHours;
        if (activeTime === "1–4 hrs/wk"  && !(h >= 1 && h <= 4))  return false;
        if (activeTime === "5–8 hrs/wk"  && !(h >= 5 && h <= 8))  return false;
        if (activeTime === "9+ hrs/wk"   && !(h >= 9))             return false;
      }
      return true;
    });
  }, [activeCategories, activeModes, activeAffils, activeTime]);

  const recommended = OPPORTUNITIES.filter((o) => o.recommended);
  const rest        = filtered.filter((o) => !o.recommended);

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Opportunities</h1>
        <p className="text-sm text-white/35 mt-0.5">
          Austin-area and remote experiences to strengthen your application profile.
        </p>
      </div>

      {/* Recommended */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={13} className="text-[#BF5700]" />
          <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#BF5700]">
            Recommended for You
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {recommended.map((opp) => (
            <div key={opp.id} className="flex flex-col gap-2">
              <div className="bg-[#BF5700]/08 border border-[#BF5700]/20 rounded-lg px-3 py-2 text-[11px] text-[#BF5700]/80 leading-snug">
                {opp.recommendReason}
              </div>
              <OpportunityCard opp={opp} onClick={() => setSelectedOpp(opp)} />
            </div>
          ))}
        </div>
      </section>

      {/* Filter Bar */}
      <section className="flex flex-wrap items-center gap-2 py-4 border-y border-white/[0.07]">
        <span className="flex items-center gap-1.5 text-[11px] text-white/30 mr-1">
          <SlidersHorizontal size={11} /> Filters
        </span>

        {CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            label={c}
            active={activeCategories.has(c)}
            onClick={() => setActiveCategories(toggleSet(activeCategories, c))}
          />
        ))}

        <div className="w-px h-4 bg-white/10 mx-1" />

        {TIME_OPTIONS.map((t) => (
          <FilterChip
            key={t}
            label={t}
            active={activeTime === t}
            onClick={() => setActiveTime(t)}
          />
        ))}

        <div className="w-px h-4 bg-white/10 mx-1" />

        {MODE_OPTIONS.map((m) => (
          <FilterChip
            key={m}
            label={m}
            active={activeModes.has(m)}
            onClick={() => setActiveModes(toggleSet(activeModes, m))}
          />
        ))}

        <div className="w-px h-4 bg-white/10 mx-1" />

        {AFFIL_OPTIONS.map((a) => (
          <FilterChip
            key={a}
            label={a}
            active={activeAffils.has(a)}
            onClick={() => setActiveAffils(toggleSet(activeAffils, a))}
          />
        ))}

        {(activeCategories.size > 0 || activeModes.size > 0 || activeAffils.size > 0 || activeTime !== "Any") && (
          <button
            onClick={() => {
              setActiveCategories(new Set());
              setActiveModes(new Set());
              setActiveAffils(new Set());
              setActiveTime("Any");
            }}
            className="ml-auto text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Clear all
          </button>
        )}
      </section>

      {/* All Opportunities */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-white/35">
            All Opportunities
          </h2>
          <span className="text-[11px] text-white/25 font-mono">{filtered.length} results</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-white/30 text-sm">No opportunities match your filters.</p>
            <button
              onClick={() => {
                setActiveCategories(new Set());
                setActiveModes(new Set());
                setActiveAffils(new Set());
                setActiveTime("Any");
              }}
              className="mt-3 text-xs text-[#BF5700] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {rest.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} onClick={() => setSelectedOpp(opp)} />
            ))}
          </div>
        )}
      </section>

      {/* Slide-out drawer */}
      <OpportunityDrawer opp={selectedOpp} onClose={() => setSelectedOpp(null)} />
    </div>
  );
}
