"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/providers";

const STATES = ["TX", "CA", "FL", "GA", "IL", "MA", "NC", "NY", "OH", "PA", "WA"];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, profileError, loading, updateProfile } = useAuth();
  const initialForm = useMemo(
    () => ({
      fullName: profile?.full_name ?? "",
      eid: profile?.eid ?? "",
      major: profile?.major ?? "",
      residencyState: profile?.residency_state ?? "TX",
      graduationYear: profile?.graduation_year != null ? String(profile.graduation_year) : "",
      appCycle: profile?.app_cycle ?? "",
      overallGpa: profile?.gpa != null ? profile.gpa.toFixed(2) : "",
      scienceGpa: profile?.science_gpa != null ? profile.science_gpa.toFixed(2) : "",
      cp: profile?.mcat_breakdown?.chem_phys != null ? String(profile.mcat_breakdown.chem_phys) : "",
      cars: profile?.mcat_breakdown?.cars != null ? String(profile.mcat_breakdown.cars) : "",
      bb: profile?.mcat_breakdown?.bio != null ? String(profile.mcat_breakdown.bio) : "",
      ps: profile?.mcat_breakdown?.psych != null ? String(profile.mcat_breakdown.psych) : "",
      clinicalHours: profile?.clinical_hours != null ? String(profile.clinical_hours) : "0",
      researchHours: profile?.research_hours != null ? String(profile.research_hours) : "0",
      volunteerHours: profile?.volunteer_hours != null ? String(profile.volunteer_hours) : "0",
      shadowingHours: profile?.shadowing_hours != null ? String(profile.shadowing_hours) : "0",
      leadershipHours: profile?.leadership_hours != null ? String(profile.leadership_hours) : "0",
      appStatus: profile?.app_status ?? "pre-app",
    }),
    [profile],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const mcatTotal =
    (Number(form.cp) || 0) +
    (Number(form.cars) || 0) +
    (Number(form.bb) || 0) +
    (Number(form.ps) || 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      full_name: form.fullName,
      eid: form.eid,
      major: form.major,
      residency_state: form.residencyState,
      graduation_year: Number(form.graduationYear),
      app_cycle: form.appCycle,
      gpa: Number(form.overallGpa),
      science_gpa: Number(form.scienceGpa),
      mcat_score: mcatTotal,
      mcat_breakdown: {
        chem_phys: Number(form.cp),
        cars: Number(form.cars),
        bio: Number(form.bb),
        psych: Number(form.ps),
      },
      clinical_hours: Number(form.clinicalHours) || 0,
      research_hours: Number(form.researchHours) || 0,
      volunteer_hours: Number(form.volunteerHours) || 0,
      shadowing_hours: Number(form.shadowingHours) || 0,
      leadership_hours: Number(form.leadershipHours) || 0,
      app_status: form.appStatus,
    };

    try {
      console.info("[onboarding] updateProfile start");
      await Promise.race([
        updateProfile(payload),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Save timed out after 15s. Check your connection and try again.")),
            15_000
          )
        ),
      ]);
      console.info("[onboarding] updateProfile ok, navigating to /dashboard");

      router.refresh();
      router.push("/dashboard");
    } catch (submitError) {
      console.error("[onboarding] save failed", submitError);
      setError(submitError instanceof Error ? submitError.message : "Unable to save onboarding profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white/60">
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading onboarding…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] px-5 py-8">
      <div className="max-w-4xl mx-auto rounded-[28px] border border-white/10 bg-white/[0.04] p-6 lg:p-8">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#BF5700]/80">Onboarding</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Build your profile</h1>
          <p className="mt-3 text-sm leading-6 text-white/45">
            Complete the core academic and profile fields the app uses for your dashboard, chance views, benchmarks, and saved account.
          </p>
        </div>

        {profileError && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Profile error: {profileError}
          </div>
        )}

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name">
              <input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="UT EID">
              <input value={form.eid} onChange={(e) => setForm((prev) => ({ ...prev, eid: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Major">
              <input value={form.major} onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Residency State">
              <select value={form.residencyState} onChange={(e) => setForm((prev) => ({ ...prev, residencyState: e.target.value }))} required className={inputCls}>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Graduation Year">
              <input type="number" min={2024} max={2035} value={form.graduationYear} onChange={(e) => setForm((prev) => ({ ...prev, graduationYear: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Application Cycle">
              <input value={form.appCycle} onChange={(e) => setForm((prev) => ({ ...prev, appCycle: e.target.value }))} required className={inputCls} placeholder="2026–2027" />
            </Field>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 mb-4">Academics</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Overall GPA">
                <input type="number" min={0} max={4} step={0.01} value={form.overallGpa} onChange={(e) => setForm((prev) => ({ ...prev, overallGpa: e.target.value }))} required className={inputCls} />
              </Field>
              <Field label="Science GPA">
                <input type="number" min={0} max={4} step={0.01} value={form.scienceGpa} onChange={(e) => setForm((prev) => ({ ...prev, scienceGpa: e.target.value }))} required className={inputCls} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-4 mt-4">
              <Field label="MCAT C/P">
                <input type="number" min={118} max={132} value={form.cp} onChange={(e) => setForm((prev) => ({ ...prev, cp: e.target.value }))} required className={inputCls} />
              </Field>
              <Field label="MCAT CARS">
                <input type="number" min={118} max={132} value={form.cars} onChange={(e) => setForm((prev) => ({ ...prev, cars: e.target.value }))} required className={inputCls} />
              </Field>
              <Field label="MCAT B/B">
                <input type="number" min={118} max={132} value={form.bb} onChange={(e) => setForm((prev) => ({ ...prev, bb: e.target.value }))} required className={inputCls} />
              </Field>
              <Field label="MCAT P/S">
                <input type="number" min={118} max={132} value={form.ps} onChange={(e) => setForm((prev) => ({ ...prev, ps: e.target.value }))} required className={inputCls} />
              </Field>
            </div>

            <div className="mt-3 text-sm text-white/45">
              Computed MCAT total: <span className="font-mono text-white/80">{mcatTotal}</span>
            </div>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 mb-4">Experience Hours</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Clinical Hours">
                <input type="number" min={0} value={form.clinicalHours} onChange={(e) => setForm((prev) => ({ ...prev, clinicalHours: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Research Hours">
                <input type="number" min={0} value={form.researchHours} onChange={(e) => setForm((prev) => ({ ...prev, researchHours: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Volunteer Hours">
                <input type="number" min={0} value={form.volunteerHours} onChange={(e) => setForm((prev) => ({ ...prev, volunteerHours: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Shadowing Hours">
                <input type="number" min={0} value={form.shadowingHours} onChange={(e) => setForm((prev) => ({ ...prev, shadowingHours: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Leadership Hours">
                <input type="number" min={0} value={form.leadershipHours} onChange={(e) => setForm((prev) => ({ ...prev, leadershipHours: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Application Status">
                <select value={form.appStatus} onChange={(e) => setForm((prev) => ({ ...prev, appStatus: e.target.value as typeof prev.appStatus }))} className={inputCls}>
                  <option value="pre-app">Pre-App</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="accepted">Accepted</option>
                </select>
              </Field>
            </div>
          </section>

          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#BF5700] px-5 py-3 text-sm font-semibold text-white hover:bg-[#A84D00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Save and Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-white/30">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#BF5700]/50";
