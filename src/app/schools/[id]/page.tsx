import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookmarkPlus,
  DollarSign,
  GitCompare,
  MapPin,
  Users,
} from "lucide-react";
import {
  getSchoolById,
  GPA_BANDS,
  MCAT_BANDS,
  heatColor,
} from "@/lib/schools-data";
import { calcProbability, tierFromProb, TIER_LABEL } from "@/lib/chance";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_SELECT, resolveUserProfile } from "@/lib/user-profile";

const TIER_CFG = {
  reach:  { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/25"   },
  target: { bg: "bg-[#BF5700]/15",   text: "text-[#BF5700]",   border: "border-[#BF5700]/30" },
  safety: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" },
} as const;

export default async function SchoolDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("users").select(PROFILE_SELECT).eq("id", user.id).maybeSingle()
    : { data: null };
  const currentUser = resolveUserProfile(profile);
  const id = Number(params.id);
  const school = Number.isFinite(id) ? getSchoolById(id) : undefined;
  if (!school) notFound();

  const hasStats = currentUser.gpa > 0 && currentUser.mcat > 0;
  const pct = hasStats ? calcProbability(currentUser.gpa, currentUser.mcat, school) : null;
  const tier = pct != null ? tierFromProb(pct) : null;
  const cfg = tier ? TIER_CFG[tier] : null;

  return (
    <div className="min-h-full bg-[#0F172A]">

      {/* Top bar */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/schools"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#BF5700] transition-colors"
          >
            <ArrowLeft size={13} /> Back to explorer
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/schools/compare?ids=${school.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              <GitCompare size={12} /> Compare
            </Link>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BF5700]/40 bg-[#BF5700]/10 text-xs text-[#BF5700] hover:bg-[#BF5700]/20 transition-colors"
            >
              <BookmarkPlus size={12} /> Add to My List
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
            school.type === "MD"
              ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
              : "text-violet-400 bg-violet-500/10 border-violet-500/20"
          }`}>
            {school.type}
          </span>
          <span className="text-[11px] text-white/30 font-mono">{school.abbr} · {school.state}</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{school.name}</h1>

        {/* Stat strip */}
        <div className="flex gap-6 mt-4">
          {[
            { label: "Median GPA",  value: school.medianGPA.toFixed(2) },
            { label: "Median MCAT", value: school.medianMCAT.toString() },
            { label: "Acceptance",  value: school.acceptanceRate + "%" },
            { label: "Class Size",  value: school.classSize.toString() },
            { label: "In-State Bias", value: school.inStateBias },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-mono text-base font-bold text-white">{value}</p>
              <p className="text-[10px] text-white/30 tracking-wider uppercase mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-3 gap-5">

        {/* Left col */}
        <div className="col-span-2 space-y-5">

          {/* Overview */}
          <section className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
              Overview
            </span>
            <p className="mt-3 text-sm text-white/65 leading-relaxed">{school.overview}</p>

            <div className="grid grid-cols-4 gap-3 mt-5">
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 flex items-center gap-3">
                <DollarSign size={14} className="text-[#BF5700] shrink-0" />
                <div>
                  <p className="font-mono text-sm font-semibold text-white">${school.tuition}k/yr</p>
                  <p className="text-[10px] text-white/30">In-state tuition</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 flex items-center gap-3">
                <Users size={14} className="text-[#BF5700] shrink-0" />
                <div>
                  <p className="font-mono text-sm font-semibold text-white">{school.classSize}</p>
                  <p className="text-[10px] text-white/30">Class size</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 flex items-center gap-3">
                <MapPin size={14} className="text-[#BF5700] shrink-0" />
                <div>
                  <p className="font-mono text-sm font-semibold text-white">{school.state}</p>
                  <p className="text-[10px] text-white/30">State</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 flex items-center gap-3">
                <BookmarkPlus size={14} className="text-[#BF5700] shrink-0" />
                <div>
                  <p className="font-mono text-sm font-semibold text-white">
                    {school.utAcceptRate != null ? school.utAcceptRate + "%" : "—"}
                  </p>
                  <p className="text-[10px] text-white/30">UT accept rate</p>
                </div>
              </div>
            </div>
          </section>

          {/* UT Outcomes */}
          <section className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
                UT Austin Outcomes
              </span>
              <span className="text-[10px] text-white/25">HPO reports 2021–2023</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              UT applicant outcomes by GPA × MCAT band. Cell = applied / interviewed /{" "}
              <span className="text-[#BF5700]">accepted</span>.
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
            <div className="flex items-center gap-3 pt-4">
              <span className="text-[10px] text-white/30">Acceptance rate intensity:</span>
              {[
                { label: "0%",   color: "rgba(191,87,0,0.08)" },
                { label: "10%+", color: "rgba(191,87,0,0.22)" },
                { label: "30%+", color: "rgba(191,87,0,0.45)" },
                { label: "50%+", color: "rgba(191,87,0,0.70)" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-white/30">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Secondaries */}
          <section className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
              Secondary Prompts
            </span>
            <div className="mt-4 space-y-3">
              {school.secondaries.length === 0 ? (
                <p className="text-sm text-white/30">No secondary prompts on record.</p>
              ) : (
                school.secondaries.map((s, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/10 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-white/75 leading-relaxed">{s.prompt}</p>
                      <span className="text-[10px] text-white/30 font-mono shrink-0 pt-0.5">#{i + 1}</span>
                    </div>
                    <p className="text-[11px] text-white/30">
                      {s.wordLimit != null ? `Word limit: ${s.wordLimit}` : "No word limit specified"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right col */}
        <div className="col-span-1 space-y-5">

          {/* Your chance */}
          <section className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
              Your Chance
            </span>
            <div className="flex items-baseline gap-2 mt-3">
              {pct != null && tier && cfg ? (
                <>
                  <span className="font-mono text-[2.6rem] font-bold text-white leading-none">{pct}%</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {TIER_LABEL[tier]}
                  </span>
                </>
              ) : (
                <span className="text-sm text-white/45">Add your GPA + MCAT in onboarding to see your chance.</span>
              )}
            </div>
            {pct != null && (
              <p className="text-[11px] text-white/30 mt-2">
                Based on your GPA {currentUser.gpa.toFixed(2)} & MCAT {currentUser.mcat} vs this school&apos;s medians.
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Your GPA</span>
                <span className="font-mono text-white/70">
                  {currentUser.gpa.toFixed(2)}{" "}
                  <span className={currentUser.gpa >= school.medianGPA ? "text-emerald-400" : "text-red-400"}>
                    ({currentUser.gpa >= school.medianGPA ? "+" : ""}{(currentUser.gpa - school.medianGPA).toFixed(2)})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Your MCAT</span>
                <span className="font-mono text-white/70">
                  {currentUser.mcat}{" "}
                  <span className={currentUser.mcat >= school.medianMCAT ? "text-emerald-400" : "text-red-400"}>
                    ({currentUser.mcat >= school.medianMCAT ? "+" : ""}{currentUser.mcat - school.medianMCAT})
                  </span>
                </span>
              </div>
            </div>
          </section>

          {/* Prerequisites */}
          <section className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/35">
              Prerequisites
            </span>
            <ul className="mt-4 space-y-2">
              {school.prerequisites.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-white/55">
                  <span className="mt-2 w-1 h-1 rounded-full bg-[#BF5700]/60 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
