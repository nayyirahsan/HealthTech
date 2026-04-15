export type UserMetrics = {
  gpa: number;
  mcat: number;
  clinicalHours: number;
  researchHours: number;
};

export type Benchmarks = UserMetrics;

export type Urgency = "low" | "medium" | "high";

export type Suggestion = {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  urgency: Urgency;
};

type CopyFn = (gap: number, user: UserMetrics) => { title: string; description: string; ctaHref: string };

const METRIC_COPY: Record<keyof UserMetrics, CopyFn> = {
  clinicalHours: (gap) => ({
    title: "Add clinical hours",
    description: `Your clinical hours are ${Math.round(gap)} below the UT median — consider adding opportunities now.`,
    ctaHref: "/activities?category=clinical",
  }),
  researchHours: (gap) => ({
    title: "Build research hours",
    description: `Your research hours are ${Math.round(gap)} below the UT median — reach out about a summer lab role.`,
    ctaHref: "/activities?category=research",
  }),
  gpa: (gap, user) => ({
    title: "Boost your GPA",
    description: `Your GPA (${user.gpa.toFixed(2)}) is ${gap.toFixed(2)} below the UT median — prioritize upper-division science grades.`,
    ctaHref: "/profile#academic-stats",
  }),
  mcat: (gap, user) => ({
    title: "Raise your MCAT",
    description: `Your MCAT (${user.mcat}) is ${Math.round(gap)} below the UT median — build a targeted prep plan or consider a retake.`,
    ctaHref: "/profile#academic-stats",
  }),
};

function urgencyFromDays(days: number): Urgency {
  if (days < 30) return "high";
  if (days < 60) return "medium";
  return "low";
}

export function getTopSuggestions(
  user: UserMetrics,
  bench: Benchmarks,
  daysToCycle: number,
  n = 2,
): Suggestion[] {
  const urgency = urgencyFromDays(daysToCycle);

  const ranked = (Object.keys(user) as (keyof UserMetrics)[])
    .map((metric) => {
      const gap = bench[metric] - user[metric];
      const normalized = bench[metric] > 0 ? gap / bench[metric] : 0;
      return { metric, gap, normalized };
    })
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.normalized - a.normalized);

  if (ranked.length === 0) {
    return [
      {
        title: "You're on track",
        description:
          "You meet or exceed the UT median across all metrics. Keep building momentum on your action plan.",
        ctaHref: "/action-plan",
        ctaLabel: "View action plan",
        urgency: "low",
      },
    ];
  }

  return ranked.slice(0, n).map(({ metric, gap }) => {
    const copy = METRIC_COPY[metric](gap, user);
    return {
      ...copy,
      ctaLabel: "View action plan",
      urgency,
    };
  });
}

export function daysUntil(dateIso: string): number {
  const now = Date.now();
  const target = new Date(dateIso).getTime();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}
