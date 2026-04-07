"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Users } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tier      = "Safety" | "Target" | "Reach";
type SortDir   = "asc" | "desc" | null;
type SortKey   = "name" | "probability" | "medianGPA" | "medianMCAT";

interface School {
  id:             number;
  name:           string;
  abbr:           string;
  state:          string;
  type:           "MD" | "DO";
  medianGPA:      number;
  medianMCAT:     number;
  acceptanceRate: number;   // national avg %
  inStateTX:      boolean;  // true = Texas school (in-state for UT students)
  utApplied:      number;   // mock UT applicants per year (avg)
  utAccepted:     number;   // mock UT accepted per year (avg)
}

// ── 50 mock schools (5 × 10 grid) ────────────────────────────────────────────

const SCHOOLS: School[] = [
  // — Top-tier reaches —
  { id:  1, name: "Harvard Medical School",           abbr: "HMS",   state: "MA", type: "MD", medianGPA: 3.95, medianMCAT: 524, acceptanceRate: 2.7,  inStateTX: false, utApplied: 28, utAccepted: 1  },
  { id:  2, name: "Johns Hopkins SOM",                abbr: "JHU",   state: "MD", type: "MD", medianGPA: 3.94, medianMCAT: 523, acceptanceRate: 2.8,  inStateTX: false, utApplied: 24, utAccepted: 1  },
  { id:  3, name: "Stanford SOM",                     abbr: "STAN",  state: "CA", type: "MD", medianGPA: 3.77, medianMCAT: 520, acceptanceRate: 2.2,  inStateTX: false, utApplied: 18, utAccepted: 1  },
  { id:  4, name: "UCSF School of Medicine",          abbr: "UCSF",  state: "CA", type: "MD", medianGPA: 3.84, medianMCAT: 518, acceptanceRate: 2.7,  inStateTX: false, utApplied: 16, utAccepted: 1  },
  { id:  5, name: "Mayo Clinic Alix SOM",             abbr: "MAYO",  state: "MN", type: "MD", medianGPA: 3.92, medianMCAT: 522, acceptanceRate: 1.9,  inStateTX: false, utApplied: 14, utAccepted: 0  },
  { id:  6, name: "Columbia Vagelos COM",             abbr: "CU",    state: "NY", type: "MD", medianGPA: 3.91, medianMCAT: 522, acceptanceRate: 3.1,  inStateTX: false, utApplied: 20, utAccepted: 1  },
  { id:  7, name: "Penn Perelman SOM",                abbr: "PENN",  state: "PA", type: "MD", medianGPA: 3.90, medianMCAT: 523, acceptanceRate: 3.3,  inStateTX: false, utApplied: 22, utAccepted: 1  },
  { id:  8, name: "Yale SOM",                         abbr: "YALE",  state: "CT", type: "MD", medianGPA: 3.88, medianMCAT: 522, acceptanceRate: 3.8,  inStateTX: false, utApplied: 19, utAccepted: 1  },
  { id:  9, name: "Duke SOM",                         abbr: "DUKE",  state: "NC", type: "MD", medianGPA: 3.87, medianMCAT: 521, acceptanceRate: 3.5,  inStateTX: false, utApplied: 17, utAccepted: 1  },
  { id: 10, name: "Washington University SOM",        abbr: "WUSTL", state: "MO", type: "MD", medianGPA: 3.92, medianMCAT: 522, acceptanceRate: 3.2,  inStateTX: false, utApplied: 15, utAccepted: 1  },

  // — Selective —
  { id: 11, name: "Baylor College of Medicine",       abbr: "BCM",   state: "TX", type: "MD", medianGPA: 3.93, medianMCAT: 522, acceptanceRate: 3.1,  inStateTX: true,  utApplied: 85, utAccepted: 10 },
  { id: 12, name: "UT Southwestern",                  abbr: "UTSW",  state: "TX", type: "MD", medianGPA: 3.91, medianMCAT: 521, acceptanceRate: 4.2,  inStateTX: true,  utApplied: 92, utAccepted: 17 },
  { id: 13, name: "Northwestern Feinberg SOM",        abbr: "NW",    state: "IL", type: "MD", medianGPA: 3.88, medianMCAT: 520, acceptanceRate: 4.7,  inStateTX: false, utApplied: 21, utAccepted: 2  },
  { id: 14, name: "Vanderbilt SOM",                   abbr: "VU",    state: "TN", type: "MD", medianGPA: 3.86, medianMCAT: 520, acceptanceRate: 4.9,  inStateTX: false, utApplied: 19, utAccepted: 2  },
  { id: 15, name: "Cornell Weill",                    abbr: "WCM",   state: "NY", type: "MD", medianGPA: 3.87, medianMCAT: 521, acceptanceRate: 4.1,  inStateTX: false, utApplied: 17, utAccepted: 1  },
  { id: 16, name: "University of Michigan",           abbr: "UMICH", state: "MI", type: "MD", medianGPA: 3.88, medianMCAT: 518, acceptanceRate: 5.3,  inStateTX: false, utApplied: 23, utAccepted: 2  },
  { id: 17, name: "Emory SOM",                        abbr: "EMO",   state: "GA", type: "MD", medianGPA: 3.81, medianMCAT: 517, acceptanceRate: 5.5,  inStateTX: false, utApplied: 18, utAccepted: 2  },
  { id: 18, name: "Dartmouth Geisel SOM",             abbr: "GS",    state: "NH", type: "MD", medianGPA: 3.67, medianMCAT: 517, acceptanceRate: 4.8,  inStateTX: false, utApplied: 12, utAccepted: 1  },
  { id: 19, name: "Pittsburgh SOM",                   abbr: "PITT",  state: "PA", type: "MD", medianGPA: 3.75, medianMCAT: 515, acceptanceRate: 6.3,  inStateTX: false, utApplied: 16, utAccepted: 1  },
  { id: 20, name: "Case Western SOM",                 abbr: "CWRU",  state: "OH", type: "MD", medianGPA: 3.79, medianMCAT: 517, acceptanceRate: 5.9,  inStateTX: false, utApplied: 14, utAccepted: 1  },

  // — Moderately selective —
  { id: 21, name: "UT Health Houston McGovern",       abbr: "UTH",   state: "TX", type: "MD", medianGPA: 3.81, medianMCAT: 514, acceptanceRate: 5.8,  inStateTX: true,  utApplied: 88, utAccepted: 18 },
  { id: 22, name: "Texas A&M COM",                    abbr: "TAMU",  state: "TX", type: "MD", medianGPA: 3.78, medianMCAT: 512, acceptanceRate: 7.4,  inStateTX: true,  utApplied: 76, utAccepted: 17 },
  { id: 23, name: "UT Rio Grande Valley SOM",         abbr: "UTRGV", state: "TX", type: "MD", medianGPA: 3.65, medianMCAT: 507, acceptanceRate: 10.2, inStateTX: true,  utApplied: 42, utAccepted: 9  },
  { id: 24, name: "TTUHSC Paul Foster SOM",           abbr: "TTEP",  state: "TX", type: "MD", medianGPA: 3.62, medianMCAT: 507, acceptanceRate: 9.8,  inStateTX: true,  utApplied: 38, utAccepted: 8  },
  { id: 25, name: "TTUHSC SOM Lubbock",               abbr: "TTU",   state: "TX", type: "MD", medianGPA: 3.64, medianMCAT: 508, acceptanceRate: 9.1,  inStateTX: true,  utApplied: 40, utAccepted: 8  },
  { id: 26, name: "Georgetown SOM",                   abbr: "GU",    state: "DC", type: "MD", medianGPA: 3.72, medianMCAT: 514, acceptanceRate: 7.1,  inStateTX: false, utApplied: 22, utAccepted: 2  },
  { id: 27, name: "George Washington SMHS",           abbr: "GWU",   state: "DC", type: "MD", medianGPA: 3.75, medianMCAT: 514, acceptanceRate: 6.9,  inStateTX: false, utApplied: 19, utAccepted: 2  },
  { id: 28, name: "Tulane SOM",                       abbr: "TUL",   state: "LA", type: "MD", medianGPA: 3.72, medianMCAT: 512, acceptanceRate: 8.6,  inStateTX: false, utApplied: 24, utAccepted: 3  },
  { id: 29, name: "Loyola Stritch SOM",               abbr: "LUC",   state: "IL", type: "MD", medianGPA: 3.72, medianMCAT: 511, acceptanceRate: 8.4,  inStateTX: false, utApplied: 16, utAccepted: 2  },
  { id: 30, name: "Cincinnati COM",                   abbr: "UC",    state: "OH", type: "MD", medianGPA: 3.77, medianMCAT: 513, acceptanceRate: 7.9,  inStateTX: false, utApplied: 14, utAccepted: 1  },

  // — Less selective MD —
  { id: 31, name: "Vermont Larner COM",               abbr: "UVM",   state: "VT", type: "MD", medianGPA: 3.73, medianMCAT: 513, acceptanceRate: 9.2,  inStateTX: false, utApplied: 11, utAccepted: 1  },
  { id: 32, name: "Albany Medical College",           abbr: "AMC",   state: "NY", type: "MD", medianGPA: 3.60, medianMCAT: 511, acceptanceRate: 12.1, inStateTX: false, utApplied: 10, utAccepted: 1  },
  { id: 33, name: "Jefferson Sidney Kimmel",          abbr: "SKMC",  state: "PA", type: "MD", medianGPA: 3.74, medianMCAT: 513, acceptanceRate: 10.0, inStateTX: false, utApplied: 13, utAccepted: 1  },
  { id: 34, name: "Creighton SOM",                    abbr: "CRE",   state: "NE", type: "MD", medianGPA: 3.71, medianMCAT: 510, acceptanceRate: 12.3, inStateTX: false, utApplied: 11, utAccepted: 2  },
  { id: 35, name: "Medical College of Wisconsin",     abbr: "MCW",   state: "WI", type: "MD", medianGPA: 3.76, medianMCAT: 512, acceptanceRate: 11.0, inStateTX: false, utApplied: 12, utAccepted: 2  },
  { id: 36, name: "Drexel COM",                       abbr: "DU",    state: "PA", type: "MD", medianGPA: 3.57, medianMCAT: 510, acceptanceRate: 14.2, inStateTX: false, utApplied: 14, utAccepted: 2  },
  { id: 37, name: "Florida International Herbert",   abbr: "FIU",   state: "FL", type: "MD", medianGPA: 3.68, medianMCAT: 510, acceptanceRate: 8.1,  inStateTX: false, utApplied: 9,  utAccepted: 1  },
  { id: 38, name: "LSU SOM New Orleans",              abbr: "LSUNO", state: "LA", type: "MD", medianGPA: 3.68, medianMCAT: 509, acceptanceRate: 11.4, inStateTX: false, utApplied: 15, utAccepted: 2  },
  { id: 39, name: "Arkansas COM",                     abbr: "UAMS",  state: "AR", type: "MD", medianGPA: 3.62, medianMCAT: 506, acceptanceRate: 13.5, inStateTX: false, utApplied: 10, utAccepted: 2  },
  { id: 40, name: "South Carolina COM",               abbr: "MUSC",  state: "SC", type: "MD", medianGPA: 3.66, medianMCAT: 508, acceptanceRate: 13.1, inStateTX: false, utApplied: 9,  utAccepted: 1  },

  // — DO schools —
  { id: 41, name: "Texas COM (TCOM)",                 abbr: "TCOM",  state: "TX", type: "DO", medianGPA: 3.64, medianMCAT: 505, acceptanceRate: 11.2, inStateTX: true,  utApplied: 62, utAccepted: 17 },
  { id: 42, name: "AT Still SOMA",                    abbr: "ATSU",  state: "AZ", type: "DO", medianGPA: 3.54, medianMCAT: 503, acceptanceRate: 14.8, inStateTX: false, utApplied: 18, utAccepted: 4  },
  { id: 43, name: "PCOM Georgia",                     abbr: "PCG",   state: "GA", type: "DO", medianGPA: 3.51, medianMCAT: 503, acceptanceRate: 15.3, inStateTX: false, utApplied: 12, utAccepted: 3  },
  { id: 44, name: "Touro COM Middletown",             abbr: "TOU",   state: "NY", type: "DO", medianGPA: 3.52, medianMCAT: 501, acceptanceRate: 17.1, inStateTX: false, utApplied: 10, utAccepted: 2  },
  { id: 45, name: "Des Moines University COM",        abbr: "DMU",   state: "IA", type: "DO", medianGPA: 3.59, medianMCAT: 504, acceptanceRate: 14.0, inStateTX: false, utApplied: 11, utAccepted: 2  },
  { id: 46, name: "Midwestern Glendale COM",          abbr: "MWG",   state: "AZ", type: "DO", medianGPA: 3.57, medianMCAT: 504, acceptanceRate: 16.5, inStateTX: false, utApplied: 14, utAccepted: 3  },
  { id: 47, name: "Chicago COM CCOM",                 abbr: "CCOM",  state: "IL", type: "DO", medianGPA: 3.57, medianMCAT: 503, acceptanceRate: 17.2, inStateTX: false, utApplied: 10, utAccepted: 2  },
  { id: 48, name: "NSU Kiran Patel COM",              abbr: "NSU",   state: "FL", type: "DO", medianGPA: 3.55, medianMCAT: 502, acceptanceRate: 16.0, inStateTX: false, utApplied: 9,  utAccepted: 2  },
  { id: 49, name: "LECOM Bradenton COM",              abbr: "LECOM", state: "FL", type: "DO", medianGPA: 3.47, medianMCAT: 499, acceptanceRate: 20.4, inStateTX: false, utApplied: 8,  utAccepted: 2  },
  { id: 50, name: "Pacific Northwest University",     abbr: "PNWU",  state: "WA", type: "DO", medianGPA: 3.45, medianMCAT: 499, acceptanceRate: 22.1, inStateTX: false, utApplied: 7,  utAccepted: 2  },
];

// ── Probability formula ───────────────────────────────────────────────────────
// Sigmoid-shaped model: base from national acceptance rate, adjusted for GPA/MCAT delta.

function calcProbability(gpa: number, mcat: number, school: School): number {
  const gpaDelta  = gpa  - school.medianGPA;
  const mcatDelta = mcat - school.medianMCAT;

  // Raw score: how many standard deviations above/below median the applicant is
  const gpaZ  = gpaDelta  / 0.15;   // ~1 SD for GPA in med school context
  const mcatZ = mcatDelta / 4.5;    // ~1 SD for MCAT

  const z = (gpaZ + mcatZ) / 2;

  // Sigmoid centred on school's acceptance rate
  const base = school.acceptanceRate / 100;
  const sigmoid = 1 / (1 + Math.exp(-2.2 * z));

  // Blend base acceptance rate with sigmoid adjustment
  const raw = base + (sigmoid - 0.5) * 0.6;

  return Math.round(Math.max(1, Math.min(97, raw * 100)));
}

// ── Color scale ───────────────────────────────────────────────────────────────

function probColor(p: number): string {
  if (p >= 55) return "#166534";  // deep green
  if (p >= 40) return "#15803d";  // green
  if (p >= 28) return "#4d7c0f";  // yellow-green
  if (p >= 18) return "#a16207";  // amber
  if (p >= 10) return "#c2410c";  // orange-red
  return "#991b1b";               // deep red
}

function probBg(p: number): string {
  if (p >= 55) return "rgba(22,101,52,0.75)";
  if (p >= 40) return "rgba(21,128,61,0.65)";
  if (p >= 28) return "rgba(77,124,15,0.55)";
  if (p >= 18) return "rgba(161,98,7,0.55)";
  if (p >= 10) return "rgba(194,65,12,0.55)";
  return "rgba(153,27,27,0.60)";
}

function tierFromProb(p: number): Tier {
  if (p >= 40) return "Safety";
  if (p >= 18) return "Target";
  return "Reach";
}

const TIER_CFG: Record<Tier, string> = {
  Safety: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Target: "text-[#BF5700]   bg-[#BF5700]/10   border-[#BF5700]/25",
  Reach:  "text-red-400     bg-red-500/10     border-red-500/20",
};

// ── UT cohort stat ────────────────────────────────────────────────────────────

function getUTStat(gpa: number, mcat: number) {
  // Weight schools by proximity to user's exact GPA/MCAT
  let totalApplied = 0, totalAccepted = 0;
  for (const s of SCHOOLS) {
    const weight = Math.max(0, 1 - (Math.abs(gpa - s.medianGPA) + Math.abs(mcat - s.medianMCAT) / 30) * 2);
    totalApplied  += Math.round(s.utApplied  * weight);
    totalAccepted += Math.round(s.utAccepted * weight);
  }
  return { applied: Math.max(5, totalApplied), accepted: Math.max(0, totalAccepted) };
}

// ── Sort helper ───────────────────────────────────────────────────────────────

function ColHeader({
  label, sortKey, currentKey, currentDir, onSort,
}: {
  label: string; sortKey: SortKey; currentKey: SortKey | null;
  currentDir: SortDir; onSort: (k: SortKey) => void;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase">
        <span className={active ? "text-[#BF5700]" : "text-white/35"}>{label}</span>
        {active
          ? currentDir === "asc"
            ? <ChevronUp   size={12} className="text-[#BF5700]" />
            : <ChevronDown size={12} className="text-[#BF5700]" />
          : <ChevronsUpDown size={11} className="text-white/20" />}
      </span>
    </th>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

const LEGEND = [
  { label: "< 10%",  bg: "rgba(153,27,27,0.60)"   },
  { label: "10–18%", bg: "rgba(194,65,12,0.55)"   },
  { label: "18–28%", bg: "rgba(161,98,7,0.55)"    },
  { label: "28–40%", bg: "rgba(77,124,15,0.55)"   },
  { label: "40–55%", bg: "rgba(21,128,61,0.65)"   },
  { label: "55%+",   bg: "rgba(22,101,52,0.75)"   },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChancePage() {
  const [gpa,      setGpa]      = useState(3.75);
  const [mcat,     setMcat]     = useState(512);
  const [sortKey,  setSortKey]  = useState<SortKey | null>("probability");
  const [sortDir,  setSortDir]  = useState<SortDir>("desc");
  const [hoveredId,setHoveredId]= useState<number | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === "asc")  { setSortDir("desc"); return; }
      if (sortDir === "desc") { setSortKey(null); setSortDir(null); return; }
    }
    setSortKey(key);
    setSortDir(key === "probability" ? "desc" : "asc");
  }

  const enriched = useMemo(
    () => SCHOOLS.map((s) => ({ ...s, probability: calcProbability(gpa, mcat, s), tier: tierFromProb(calcProbability(gpa, mcat, s)) })),
    [gpa, mcat]
  );

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return enriched;
    return [...enriched].sort((a, b) => {
      const av = a[sortKey as keyof typeof a] as number | string;
      const bv = b[sortKey as keyof typeof b] as number | string;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [enriched, sortKey, sortDir]);

  const utStat = useMemo(() => getUTStat(gpa, mcat), [gpa, mcat]);

  const hovered = hoveredId != null ? enriched.find((s) => s.id === hoveredId) : null;

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Chance Calculator</h1>
        <p className="text-sm text-white/35 mt-0.5">
          Adjust your GPA and MCAT to see personalized acceptance probabilities across 50 schools.
        </p>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-6 bg-white/[0.04] border border-white/10 rounded-xl p-5">
        {/* GPA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">GPA</span>
            <span className="font-mono text-2xl font-bold text-white">{gpa.toFixed(2)}</span>
          </div>
          <input
            type="range" min={2.0} max={4.0} step={0.01} value={gpa}
            onChange={(e) => setGpa(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#BF5700] bg-white/10"
          />
          <div className="flex justify-between text-[10px] text-white/20 font-mono">
            <span>2.0</span><span>3.0</span><span>4.0</span>
          </div>
        </div>

        {/* MCAT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">MCAT</span>
            <span className="font-mono text-2xl font-bold text-white">{mcat}</span>
          </div>
          <input
            type="range" min={472} max={528} step={1} value={mcat}
            onChange={(e) => setMcat(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#BF5700] bg-white/10"
          />
          <div className="flex justify-between text-[10px] text-white/20 font-mono">
            <span>472</span><span>500</span><span>528</span>
          </div>
        </div>
      </div>

      {/* Grid + stat */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
            Probability Grid
          </span>
          <div className="flex items-center gap-2">
            {LEGEND.map(({ label, bg }) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: bg }} />
                <span className="text-[10px] text-white/25 font-mono">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 10 × 5 grid */}
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
        >
          {enriched.map((s) => (
            <button
              key={s.id}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="prob-cell relative rounded-lg p-2 flex flex-col items-center justify-center gap-0.5 min-h-[60px] border border-white/[0.08] hover:border-white/30 hover:scale-105 focus:outline-none"
              style={{
                backgroundColor: probBg(s.probability),
                transition: "background-color 0.35s ease, border-color 0.15s ease, transform 0.1s ease",
              }}
            >
              <span className="text-[9px] font-mono font-bold text-white/70 leading-none tracking-wide">
                {s.abbr}
              </span>
              <span
                className="text-xs font-bold tabular-nums leading-none"
                style={{ color: s.probability >= 28 ? "#fff" : "#fca5a5", transition: "color 0.35s ease" }}
              >
                {s.probability}%
              </span>
            </button>
          ))}
        </div>

        {/* Hover tooltip / UT stat row */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl min-h-[52px]">
          {hovered ? (
            <>
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: probBg(hovered.probability) }}
              />
              <p className="text-sm text-white/70 flex-1">
                <span className="font-semibold text-white">{hovered.name}</span>
                {" · "}Median GPA{" "}
                <span className="font-mono text-white">{hovered.medianGPA.toFixed(2)}</span>
                {" · "}Median MCAT{" "}
                <span className="font-mono text-white">{hovered.medianMCAT}</span>
                {" · "}National acceptance{" "}
                <span className="font-mono text-white">{hovered.acceptanceRate}%</span>
              </p>
              <span
                className="text-sm font-bold font-mono shrink-0"
                style={{ color: probColor(hovered.probability) }}
              >
                Your chance: {hovered.probability}%
              </span>
            </>
          ) : (
            <>
              <Users size={14} className="text-[#BF5700] shrink-0" />
              <p className="text-sm text-white/55 flex-1">
                Approximately{" "}
                <span className="font-semibold text-white">{utStat.applied}</span> UT students
                with a similar profile applied last cycle.{" "}
                <span className="font-semibold text-white">{utStat.accepted}</span> were accepted.
              </p>
              <span className="text-xs text-white/25 font-mono shrink-0">
                Hover a cell for details
              </span>
            </>
          )}
        </div>
      </div>

      {/* Ranked table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
            All Schools — Ranked by Your Probability
          </span>
          <span className="text-[11px] text-white/20 font-mono">{sorted.length} schools</span>
        </div>

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-[#0A1120]">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left w-8">
                  <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/25">#</span>
                </th>
                <ColHeader label="School"       sortKey="name"        currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <ColHeader label="Your Prob."   sortKey="probability" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <ColHeader label="Median GPA"   sortKey="medianGPA"   currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <ColHeader label="Median MCAT"  sortKey="medianMCAT"  currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left">
                  <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-white/35">Tier</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((school, i) => (
                <tr
                  key={school.id}
                  className={`border-b border-white/[0.05] transition-colors hover:bg-[#BF5700]/[0.05] ${
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-white/20 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-white/80">{school.name}</p>
                      <p className="text-[11px] text-white/30 font-mono mt-0.5">
                        {school.abbr} · {school.state} · {school.type}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${school.probability}%`,
                            backgroundColor: probColor(school.probability),
                            transition: "width 0.35s ease",
                          }}
                        />
                      </div>
                      <span
                        className="font-mono text-sm font-bold tabular-nums w-10"
                        style={{ color: probColor(school.probability) }}
                      >
                        {school.probability}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-sm text-white/55 tabular-nums">
                    {school.medianGPA.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-sm text-white/55 tabular-nums">
                    {school.medianMCAT}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${TIER_CFG[school.tier]}`}>
                      {school.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
