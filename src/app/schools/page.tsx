"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
  BookmarkPlus,
  MapPin,
  DollarSign,
  Users,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";

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

// ── Constants ─────────────────────────────────────────────────────────────────

const GPA_BANDS  = ["3.8–4.0", "3.6–3.79", "3.4–3.59", "< 3.4"];
const MCAT_BANDS = ["517–528", "510–516", "500–509", "< 500"];

// Convert numeric in_state_bias % → display label
function biasLabel(val: number | null): School["inStateBias"] {
  if (val == null) return "Low";
  if (val >= 70)   return "High";
  if (val >= 40)   return "Moderate";
  return "Low";
}

// Map a raw Supabase row → School shape the UI expects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): School {
  return {
    id:             row.id,
    name:           row.name,
    abbr:           row.name.split(" ").map((w: string) => w[0]).join("").slice(0, 5).toUpperCase(),
    state:          row.state          ?? "—",
    type:           (row.type as SchoolType) ?? "MD",
    medianGPA:      row.median_gpa     ?? 0,
    medianMCAT:     row.median_mcat    ?? 0,
    acceptanceRate: row.acceptance_rate ?? 0,
    inStateBias:    biasLabel(row.in_state_bias),
    utAcceptRate:   null,
    tuition:        row.tuition_in_state ? Math.round(row.tuition_in_state / 1000) : 0,
    classSize:      row.class_size     ?? 0,
    overview:       row.mission_keywords?.join(", ") ?? "",
    secondaries:    [],
    prerequisites:  row.prereqs ? Object.keys(row.prereqs).filter((k: string) => row.prereqs[k]) : [],
    utOutcomes:     {},
  };
}

const SCHOOLS_FALLBACK: School[] = [];

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
                                  className="heat-cell rounded-md p-2 text-center min-w-[72px]"
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
  const [schools,     setSchools]     = useState<School[]>(SCHOOLS_FALLBACK);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [selected,    setSelected]    = useState<School | null>(null);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<"All" | "MD" | "DO">("All");
  const [stateFilter, setStateFilter] = useState<"All" | "In-State" | "Out-of-State">("All");
  const [gpaRange,    setGpaRange]    = useState<[number, number]>([3.0, 4.0]);
  const [mcatRange,   setMcatRange]   = useState<[number, number]>([495, 528]);
  const [sortKey,     setSortKey]     = useState<SortKey | null>(null);
  const [sortDir,     setSortDir]     = useState<SortDir>(null);
  const [page,        setPage]        = useState(0);

  const ROWS_PER_PAGE = 10;

  // Fetch real schools from Supabase on page load
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("schools")
      .select("id, name, state, type, median_gpa, median_mcat, acceptance_rate, in_state_bias, tuition_in_state, class_size, mission_keywords, prereqs")
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setSchools([]);
          setLoading(false);
          return;
        }
        setSchools((data ?? []).map(mapRow));
        setLoading(false);
      });
  }, []);

  // Reset to first page whenever filters/sort change
  useEffect(() => { setPage(0); }, [search, typeFilter, stateFilter, gpaRange, mcatRange, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === "asc")  { setSortDir("desc"); return; }
      if (sortDir === "desc") { setSortKey(null); setSortDir(null); return; }
    }
    setSortKey(key);
    setSortDir("asc");
  }

  const rows = useMemo(() => {
    let list = schools.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.abbr.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "All" && s.type !== typeFilter) return false;
      if (stateFilter === "In-State"     && s.state !== "TX") return false;
      if (stateFilter === "Out-of-State" && s.state === "TX") return false;
      // Keep rows with unknown stats visible; only filter when a value exists.
      if (s.medianGPA > 0 && (s.medianGPA < gpaRange[0] || s.medianGPA > gpaRange[1])) return false;
      if (s.medianMCAT > 0 && (s.medianMCAT < mcatRange[0] || s.medianMCAT > mcatRange[1])) return false;
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

  const usingDefaultFilters =
    search.trim() === "" &&
    typeFilter === "All" &&
    stateFilter === "All" &&
    gpaRange[0] === 3.0 &&
    gpaRange[1] === 4.0 &&
    mcatRange[0] === 495 &&
    mcatRange[1] === 528 &&
    sortKey === null &&
    sortDir === null;

  const displayRows = rows.length === 0 && usingDefaultFilters ? schools : rows;

  const totalPages  = Math.ceil(displayRows.length / ROWS_PER_PAGE);
  const visibleRows = displayRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  return (
    <div className="min-h-full bg-[#0F172A] flex flex-col">

      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">School Explorer</h1>
            <p className="text-sm text-white/35 mt-0.5">
              {loading ? "Loading schools…" : loadError ? `Unable to load schools: ${loadError}` : "Click any row for details"}
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
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-white/25 text-sm">
                  No schools match your filters.
                </td>
              </tr>
            ) : (
              visibleRows.map((school, i) => (
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
                    {school.medianGPA > 0 ? school.medianGPA.toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-white/70 tabular-nums">
                    {school.medianMCAT > 0 ? school.medianMCAT : "—"}
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

        {totalPages > 1 && (
          <div className="border-t border-white/[0.05] px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-white/30">
              {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, displayRows.length)} of {displayRows.length} schools
            </span>
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
          </div>
        )}
      </div>

      <SchoolDrawer school={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
