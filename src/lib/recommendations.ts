import type { UserProfileRow } from "@/lib/user-profile";

// AAMC score-report section medians for matriculants. Used for the
// /next-steps MCAT radar chart since ut_benchmarks tracks total only.
export const MCAT_SECTION_MEDIANS = {
  chem_phys: 127,
  cars: 126,
  bio: 128,
  psych: 127,
} as const;

export type RecommendationVisual = "activity" | "mcat" | "gpa" | "deadlines";
export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationCategory =
  | "Clinical"
  | "Research"
  | "Volunteering"
  | "Shadowing"
  | "Academics"
  | "MCAT"
  | "Application";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  visual: RecommendationVisual;
}

export interface BenchmarkRow {
  metric: string;
  median_value: number;
}

const PRIORITY_RANK: Record<RecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function benchmark(rows: BenchmarkRow[], metric: string): number | null {
  const row = rows.find((r) => r.metric === metric);
  return row ? Number(row.median_value) : null;
}

export function buildRecommendations(
  profile: UserProfileRow | null | undefined,
  benchmarks: BenchmarkRow[]
): Recommendation[] {
  if (!profile) return [];

  const recs: Recommendation[] = [];

  const clinicalMedian = benchmark(benchmarks, "clinical_hours") ?? 1200;
  const researchMedian = benchmark(benchmarks, "research_hours") ?? 600;
  const volunteerMedian = benchmark(benchmarks, "volunteer_hours") ?? 250;
  const shadowingMedian = benchmark(benchmarks, "shadowing_hours") ?? 120;
  const gpaMedian = benchmark(benchmarks, "gpa") ?? 3.82;
  const mcatMedian = benchmark(benchmarks, "mcat") ?? 513;

  const clinicalHours = profile.clinical_hours ?? 0;
  if (clinicalHours < clinicalMedian) {
    const gap = clinicalMedian - clinicalHours;
    recs.push({
      id: "clinical-hours",
      title: `Add ~${gap} clinical hours`,
      description: `You're at ${clinicalHours} hours — UT's median matriculant is around ${clinicalMedian}. A consistent weekly clinical role over 6–9 months closes this gap.`,
      priority: gap > clinicalMedian * 0.5 ? "high" : "medium",
      category: "Clinical",
      visual: "activity",
    });
  }

  const researchHours = profile.research_hours ?? 0;
  if (researchHours < researchMedian) {
    const gap = researchMedian - researchHours;
    recs.push({
      id: "research-hours",
      title: `Build research depth (~${gap} more hours)`,
      description: `You have ${researchHours} research hours; UT's median is ~${researchMedian}. Sustained involvement in one lab — ideally with a tangible output (poster, abstract, manuscript) — is more valuable than spreading thin.`,
      priority: researchHours === 0 ? "high" : "medium",
      category: "Research",
      visual: "activity",
    });
  }

  const mcat = profile.mcat_score ?? 0;
  if (mcat > 0 && mcat < mcatMedian) {
    recs.push({
      id: "mcat",
      title: `Lift MCAT toward ${mcatMedian}+`,
      description: `Your ${mcat} is below UT's ~${mcatMedian} median. If you have 4+ months before the cycle opens, a structured study block targeting your weakest section can move 3–5 points.`,
      priority: profile.app_status === "pre-app" ? "high" : "medium",
      category: "MCAT",
      visual: "mcat",
    });
  } else if (mcat === 0) {
    recs.push({
      id: "mcat",
      title: "Take the MCAT",
      description: `No MCAT score on file. Most matriculants test 4–6 months before submitting primaries. Plan a 3–4 month study block and lock in a test date.`,
      priority: "high",
      category: "MCAT",
      visual: "mcat",
    });
  }

  const gpa = profile.gpa ?? 0;
  if (gpa > 0 && gpa < gpaMedian) {
    recs.push({
      id: "gpa",
      title: gpa < 3.5 ? "Strengthen academic record" : "Sharpen GPA toward UT median",
      description: `Your ${gpa.toFixed(2)} cumulative is below UT's ~${gpaMedian.toFixed(2)} matriculant median. Strong upward trends and graduate science coursework can offset earlier semesters.`,
      priority: gpa < 3.5 ? "high" : "medium",
      category: "Academics",
      visual: "gpa",
    });
  }

  const volunteerHours = profile.volunteer_hours ?? 0;
  if (volunteerHours < volunteerMedian) {
    recs.push({
      id: "volunteer-hours",
      title: "Add non-clinical volunteering",
      description: `You're at ${volunteerHours} non-clinical volunteer hours; UT's median is ~${volunteerMedian}. Schools want sustained service that isn't tied to medicine — tutoring, food banks, community orgs all count.`,
      priority: "low",
      category: "Volunteering",
      visual: "activity",
    });
  }

  const shadowingHours = profile.shadowing_hours ?? 0;
  if (shadowingHours < shadowingMedian) {
    recs.push({
      id: "shadowing-hours",
      title: "Round out shadowing across specialties",
      description: `${shadowingHours} shadowing hours is below the ~${shadowingMedian} median. Aim for a mix of primary care and at least one surgical/procedural specialty.`,
      priority: "low",
      category: "Shadowing",
      visual: "activity",
    });
  }

  // Always end with the deadlines/cycle reminder so the user can navigate
  // toward concrete dates after working through the gap-closing items.
  recs.push({
    id: "deadlines",
    title: "Track cycle deadlines",
    description: "Stay ahead of TMDSAS and AMCAS milestones. Submitting primaries within the first 2 weeks of the cycle is one of the highest-leverage things you can do.",
    priority: "low",
    category: "Application",
    visual: "deadlines",
  });

  return recs.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}
