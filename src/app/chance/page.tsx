"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tier = "Safety" | "Target" | "Reach";

interface School {
  id:             number;
  name:           string;
  abbr:           string;
  state:          string;
  type:           "MD" | "DO";
  medianGPA:      number;
  medianMCAT:     number;
  acceptanceRate: number;
  inStateTX:      boolean;
  utApplied:      number;
  utAccepted:     number;
}

// ── Map Supabase row → School ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): School {
  return {
    id:             row.id,
    name:           row.name,
    abbr:           row.name.split(" ").map((w: string) => w[0]).join("").slice(0, 5).toUpperCase(),
    state:          row.state          ?? "—",
    type:           row.type           ?? "MD",
    medianGPA:      row.median_gpa     ?? 0,
    medianMCAT:     row.median_mcat    ?? 0,
    acceptanceRate: row.acceptance_rate ?? 0,
    inStateTX:      row.state === "TX",
    utApplied:      0,
    utAccepted:     0,
  };
}

const SCHOOLS_FALLBACK: School[] = [];

// ── Probability formula ───────────────────────────────────────────────────────

function calcProbability(gpa: number, mcat: number, school: School): number {
  const gpaZ  = (gpa  - school.medianGPA)  / 0.15;
  const mcatZ = (mcat - school.medianMCAT) / 4.5;
  const z     = (gpaZ + mcatZ) / 2;
  const base  = school.acceptanceRate / 100;
  const sig   = 1 / (1 + Math.exp(-2.2 * z));
  const raw   = base + (sig - 0.5) * 0.6;
  return Math.round(Math.max(1, Math.min(97, raw * 100)));
}

function probColor(p: number): string {
  if (p >= 55) return "#166534";
  if (p >= 40) return "#15803d";
  if (p >= 28) return "#4d7c0f";
  if (p >= 18) return "#a16207";
  if (p >= 10) return "#c2410c";
  return "#991b1b";
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

// ── UT cohort stat ────────────────────────────────────────────────────────────

function getUTStat(gpa: number, mcat: number, schools: School[]) {
  let totalApplied = 0, totalAccepted = 0;
  for (const s of schools) {
    const weight = Math.max(0, 1 - (Math.abs(gpa - s.medianGPA) + Math.abs(mcat - s.medianMCAT) / 30) * 2);
    totalApplied  += Math.round(s.utApplied  * weight);
    totalAccepted += Math.round(s.utAccepted * weight);
  }
  return { applied: Math.max(5, totalApplied), accepted: Math.max(0, totalAccepted) };
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

const CELLS_PER_PAGE = 60; // 6 × 10

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChancePage() {
  const [schools,   setSchools]   = useState<School[]>(SCHOOLS_FALLBACK);
  const [gpa,       setGpa]       = useState(3.75);
  const [mcat,      setMcat]      = useState(512);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [page,      setPage]      = useState(0);

  // Reset to first page whenever sliders change
  useEffect(() => { setPage(0); }, [gpa, mcat]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("schools")
      .select("id, name, type, state, median_gpa, median_mcat, acceptance_rate")
      .not("median_gpa", "is", null)
      .not("median_mcat", "is", null)
      .order("name")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setSchools(data.map(mapRow));
        }
      });
  }, []);

  const enriched = useMemo(
    () =>
      schools
        .map((s) => ({ ...s, probability: calcProbability(gpa, mcat, s), tier: tierFromProb(calcProbability(gpa, mcat, s)) }))
        .sort((a, b) => b.probability - a.probability),
    [gpa, mcat, schools]
  );

  const totalPages  = Math.ceil(enriched.length / CELLS_PER_PAGE);
  const pageSchools = enriched.slice(page * CELLS_PER_PAGE, (page + 1) * CELLS_PER_PAGE);

  const hovered  = hoveredId != null ? enriched.find((s) => s.id === hoveredId) : null;
  const utStat   = useMemo(() => getUTStat(gpa, mcat, schools), [gpa, mcat, schools]);

  return (
    <div className="min-h-full bg-[#0F172A] p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Chance Calculator</h1>
        <p className="text-sm text-white/35 mt-0.5">
          Adjust your GPA and MCAT to see personalized acceptance probabilities across {enriched.length} schools.
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

      {/* Grid */}
      <div className="space-y-3">

        {/* Grid header: legend + pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {LEGEND.map(({ label, bg }) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: bg }} />
                <span className="text-[10px] text-white/25 font-mono">{label}</span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/80 hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] text-white/35 font-mono tabular-nums w-16 text-center">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/80 hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 10 × 10 grid */}
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
        >
          {pageSchools.map((s) => (
            <button
              key={s.id}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative rounded-lg p-2 flex flex-col items-center justify-center gap-0.5 min-h-[60px] border border-white/[0.08] hover:border-white/30 hover:scale-105 focus:outline-none transition-all"
              style={{ backgroundColor: probBg(s.probability) }}
            >
              <span className="text-[9px] font-mono font-bold text-white/70 leading-none tracking-wide">
                {s.abbr}
              </span>
              <span
                className="text-xs font-bold tabular-nums leading-none"
                style={{ color: s.probability >= 28 ? "#fff" : "#fca5a5" }}
              >
                {s.probability}%
              </span>
            </button>
          ))}

          {/* Pad last row if page isn't full */}
          {pageSchools.length < CELLS_PER_PAGE &&
            Array.from({ length: CELLS_PER_PAGE - pageSchools.length }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[60px] rounded-lg border border-white/[0.03]" />
            ))}
        </div>

        {/* Hover tooltip / UT cohort stat */}
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

        {/* Bottom pagination (repeated for convenience) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 hover:text-white/80 hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={12} /> Prev
            </button>

            {/* Page dots */}
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === page ? "bg-[#BF5700]" : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 hover:text-white/80 hover:border-white/25 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
