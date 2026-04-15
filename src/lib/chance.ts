// Shared acceptance-probability model used by the dashboard and /chance page.
// Sigmoid-shaped: base from national acceptance rate, adjusted for GPA/MCAT
// delta vs the school's admitted-student medians.

export type Tier = "reach" | "target" | "safety";

export interface SchoolStats {
  medianGPA: number;
  medianMCAT: number;
  acceptanceRate: number; // national avg %
}

export function calcProbability(
  gpa: number,
  mcat: number,
  school: SchoolStats,
): number {
  const gpaDelta  = gpa  - school.medianGPA;
  const mcatDelta = mcat - school.medianMCAT;
  const gpaZ      = gpaDelta  / 0.15;
  const mcatZ     = mcatDelta / 4.5;
  const z         = (gpaZ + mcatZ) / 2;
  const base      = school.acceptanceRate / 100;
  const sigmoid   = 1 / (1 + Math.exp(-2.2 * z));
  const raw       = base + (sigmoid - 0.5) * 0.6;
  return Math.round(Math.max(1, Math.min(97, raw * 100)));
}

export function tierFromProb(p: number): Tier {
  if (p >= 40) return "safety";
  if (p >= 18) return "target";
  return "reach";
}

export const TIER_LABEL: Record<Tier, string> = {
  reach:  "Reach",
  target: "Target",
  safety: "Safety",
};
