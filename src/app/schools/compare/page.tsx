import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { SCHOOLS, getSchoolById, type School } from "@/lib/schools-data";
import { calcProbability, tierFromProb, TIER_LABEL, type Tier } from "@/lib/chance";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_SELECT, resolveUserProfile } from "@/lib/user-profile";

const TIER_CFG: Record<Tier, { bg: string; text: string; border: string }> = {
  reach:  { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/25"   },
  target: { bg: "bg-[#BF5700]/15",   text: "text-[#BF5700]",   border: "border-[#BF5700]/30" },
  safety: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" },
};

function parseIds(raw: string | string[] | undefined): number[] {
  if (!raw) return [];
  const joined = Array.isArray(raw) ? raw.join(",") : raw;
  return joined
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

function hrefWithout(ids: number[], dropId: number): string {
  const rest = ids.filter((id) => id !== dropId);
  return rest.length ? `/schools/compare?ids=${rest.join(",")}` : "/schools/compare";
}

// Highlight helpers — mark the best / worst value across the compared set.
function bestValue(values: number[], mode: "max" | "min"): number | null {
  if (values.length === 0) return null;
  return mode === "max" ? Math.max(...values) : Math.min(...values);
}

export default async function SchoolComparePage({
  searchParams,
}: {
  searchParams: { ids?: string | string[] };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("users").select(PROFILE_SELECT).eq("id", user.id).maybeSingle()
    : { data: null };
  const currentUser = resolveUserProfile(profile);
  const rawIds = parseIds(searchParams.ids);
  const schools = rawIds
    .map((id) => getSchoolById(id))
    .filter((s): s is School => !!s)
    .slice(0, 4);

  const hasStats = currentUser.gpa > 0 && currentUser.mcat > 0;
  const chances = schools.map((s) =>
    hasStats ? calcProbability(currentUser.gpa, currentUser.mcat, s) : null
  );
  const gpas    = schools.map((s) => s.medianGPA);
  const mcats   = schools.map((s) => s.medianMCAT);
  const rates   = schools.map((s) => s.acceptanceRate);
  const tuis    = schools.map((s) => s.tuition);
  const utAccs  = schools.map((s) => s.utAcceptRate).filter((v): v is number => v != null);

  // For "best", we pick: lower GPA median = easier, lower MCAT median = easier,
  // higher acceptance rate = easier, lower tuition = better, higher UT accept = better,
  // higher your-chance = better.
  const bestGpa  = bestValue(gpas,   "min");
  const bestMcat = bestValue(mcats,  "min");
  const bestRate = bestValue(rates,  "max");
  const bestTui  = bestValue(tuis,   "min");
  const bestUt   = bestValue(utAccs, "max");
  const validChances = chances.filter((c): c is number => c != null);
  const bestChance = bestValue(validChances, "max");

  return (
    <div className="min-h-full bg-[#0F172A]">

      {/* Top bar */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.07]">
        <Link
          href="/schools"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-[#BF5700] transition-colors mb-5"
        >
          <ArrowLeft size={13} /> Back to explorer
        </Link>

        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Compare Schools</h1>
            <p className="text-sm text-white/35 mt-0.5">
              Side-by-side comparison · up to 4 schools · best values highlighted
            </p>
          </div>
          <span className="text-[11px] text-white/25 font-mono">
            {schools.length} of 4 selected
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {schools.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* School cards */}
            <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `repeat(${schools.length}, minmax(0, 1fr))` }}>
              {schools.map((school, i) => {
                const pct = chances[i];
                const tier = pct != null ? tierFromProb(pct) : null;
                const cfg = tier ? TIER_CFG[tier] : null;
                return (
                  <div key={school.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-5 relative">
                    <Link
                      href={hrefWithout(rawIds, school.id)}
                      className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors"
                      aria-label={`Remove ${school.name}`}
                    >
                      <X size={14} />
                    </Link>

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
                    <Link href={`/schools/${school.id}`} className="block hover:text-[#BF5700] transition-colors">
                      <h2 className="text-base font-bold text-white leading-snug pr-6">{school.name}</h2>
                    </Link>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-baseline gap-2">
                      {pct != null && tier && cfg ? (
                        <>
                          <span className="font-mono text-2xl font-bold text-white leading-none">{pct}%</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {TIER_LABEL[tier]}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-white/40">Add GPA + MCAT in onboarding to see your chance</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">Your chance</p>
                  </div>
                );
              })}
            </div>

            {/* Comparison table */}
            <div className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-5 py-3 text-[10px] font-medium tracking-[0.15em] uppercase text-white/35 w-48">
                      Metric
                    </th>
                    {schools.map((s) => (
                      <th key={s.id} className="text-left px-5 py-3 text-[11px] font-semibold text-white/70 tracking-tight">
                        {s.abbr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <Row
                    label="Median GPA"
                    values={schools.map((s, i) => ({
                      display: s.medianGPA.toFixed(2),
                      isBest: s.medianGPA === bestGpa,
                      key: `gpa-${i}`,
                    }))}
                  />
                  <Row
                    label="Median MCAT"
                    values={schools.map((s, i) => ({
                      display: s.medianMCAT.toString(),
                      isBest: s.medianMCAT === bestMcat,
                      key: `mcat-${i}`,
                    }))}
                  />
                  <Row
                    label="Acceptance Rate"
                    values={schools.map((s, i) => ({
                      display: s.acceptanceRate + "%",
                      isBest: s.acceptanceRate === bestRate,
                      key: `rate-${i}`,
                    }))}
                  />
                  <Row
                    label="UT Accept Rate"
                    values={schools.map((s, i) => ({
                      display: s.utAcceptRate != null ? s.utAcceptRate + "%" : "—",
                      isBest: s.utAcceptRate != null && s.utAcceptRate === bestUt,
                      key: `utacc-${i}`,
                    }))}
                  />
                  <Row
                    label="Tuition (in-state)"
                    values={schools.map((s, i) => ({
                      display: `$${s.tuition}k/yr`,
                      isBest: s.tuition === bestTui,
                      key: `tui-${i}`,
                    }))}
                  />
                  <Row
                    label="Class Size"
                    values={schools.map((s, i) => ({
                      display: s.classSize.toString(),
                      isBest: false,
                      key: `cs-${i}`,
                    }))}
                  />
                  <Row
                    label="In-State Bias"
                    values={schools.map((s, i) => ({
                      display: s.inStateBias,
                      isBest: false,
                      key: `bias-${i}`,
                    }))}
                  />
                  <Row
                    label="Your Chance"
                    values={schools.map((_, i) => ({
                      display: chances[i] != null ? chances[i] + "%" : "—",
                      isBest: chances[i] != null && chances[i] === bestChance,
                      key: `chance-${i}`,
                    }))}
                  />
                  <Row
                    label="# Secondary Prompts"
                    values={schools.map((s, i) => ({
                      display: s.secondaries.length.toString(),
                      isBest: false,
                      key: `sec-${i}`,
                    }))}
                  />
                </tbody>
              </table>
            </div>

            {/* Add more */}
            {schools.length < 4 && (
              <AddMoreRow selectedIds={rawIds} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

function Row({
  label,
  values,
}: {
  label:  string;
  values: { display: string; isBest: boolean; key: string }[];
}) {
  return (
    <tr className="border-b border-white/[0.05] last:border-b-0">
      <td className="px-5 py-3 text-xs text-white/40 font-medium">{label}</td>
      {values.map((v) => (
        <td
          key={v.key}
          className={`px-5 py-3 font-mono text-sm tabular-nums ${
            v.isBest ? "text-[#BF5700] font-semibold" : "text-white/70"
          }`}
        >
          {v.display}
          {v.isBest && <span className="ml-1.5 text-[9px] align-middle">●</span>}
        </td>
      ))}
    </tr>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-10 text-center">
      <h2 className="text-base font-semibold text-white/80 mb-2">No schools selected</h2>
      <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
        Pass school ids in the URL like{" "}
        <code className="text-[#BF5700] bg-white/5 px-1.5 py-0.5 rounded">?ids=1,3,5</code>, or pick
        a few below to start comparing.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SCHOOLS.slice(0, 6).map((s) => (
          <Link
            key={s.id}
            href={`/schools/compare?ids=${s.id}`}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-white/60 hover:border-[#BF5700]/40 hover:text-[#BF5700] transition-colors"
          >
            {s.abbr}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── "Add more" picker ─────────────────────────────────────────────────────────

function AddMoreRow({ selectedIds }: { selectedIds: number[] }) {
  const selectedSet = new Set(selectedIds);
  const candidates = SCHOOLS.filter((s) => !selectedSet.has(s.id)).slice(0, 6);
  if (candidates.length === 0) return null;

  return (
    <div className="mt-5 bg-white/[0.03] border border-white/10 rounded-xl p-4">
      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
        Add another school
      </span>
      <div className="mt-3 flex flex-wrap gap-2">
        {candidates.map((s) => {
          const nextIds = [...selectedIds, s.id];
          return (
            <Link
              key={s.id}
              href={`/schools/compare?ids=${nextIds.join(",")}`}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-white/60 hover:border-[#BF5700]/40 hover:text-[#BF5700] transition-colors"
            >
              + {s.abbr}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
