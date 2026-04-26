// Shared logic for turning a user's activities (and the master deadline list)
// into actionable tasks. Used by /timeline and /action-plan.

export type ActivityCategory =
  | "Clinical"
  | "Research"
  | "Volunteering"
  | "Shadowing"
  | "Leadership"
  | "Other";

export interface ActivityRow {
  id: number;
  name: string;
  category: ActivityCategory;
  hours: number;
  end_date: string | null;
}

export interface ActivityHoursProfile {
  clinical_hours: number | null;
  research_hours: number | null;
  volunteer_hours: number | null;
  shadowing_hours: number | null;
  leadership_hours: number | null;
}

export interface DeadlineRow {
  id: number;
  key?: string;
  label: string;
  date: string;
  system: "AMCAS" | "TMDSAS" | "Both";
  type: "milestone" | "submission" | "deadline";
}

export interface PersonalTask {
  id: string;
  label: string;
  dueDate: string;
  completed: boolean;
}

export type Priority = "high" | "medium" | "low";

export interface ActionItem {
  id: string;
  title: string;
  priority: Priority;
  dueDate: string;
}

const CATEGORY_MEDIANS: Record<ActivityCategory, number> = {
  Clinical: 1200,
  Research: 600,
  Volunteering: 250,
  Shadowing: 120,
  Leadership: 75,
  Other: 100,
};

const TODAY = new Date();

const PROFILE_ACTIVITY_FIELDS: Array<{
  id: number;
  category: ActivityCategory;
  label: string;
  field: keyof ActivityHoursProfile;
}> = [
  { id: -1, category: "Clinical", label: "Clinical experience from onboarding", field: "clinical_hours" },
  { id: -2, category: "Research", label: "Research experience from onboarding", field: "research_hours" },
  { id: -3, category: "Volunteering", label: "Volunteer experience from onboarding", field: "volunteer_hours" },
  { id: -4, category: "Shadowing", label: "Shadowing from onboarding", field: "shadowing_hours" },
  { id: -5, category: "Leadership", label: "Leadership experience from onboarding", field: "leadership_hours" },
];

export function buildProfileActivityRows(
  profile: ActivityHoursProfile | null | undefined
): ActivityRow[] {
  if (!profile) return [];

  return PROFILE_ACTIVITY_FIELDS.map((item) => ({
    id: item.id,
    name: item.label,
    category: item.category,
    hours: Number(profile[item.field]) || 0,
    end_date: null,
  })).filter((row) => row.hours > 0);
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - TODAY.getTime()) / 86_400_000);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function buildPersonalTasks(rows: ActivityRow[]): PersonalTask[] {
  if (rows.length === 0) return [];

  const completionTasks: PersonalTask[] = rows
    .filter((r) => r.end_date)
    .sort((a, b) => (a.end_date ?? "").localeCompare(b.end_date ?? ""))
    .slice(0, 6)
    .map((r) => ({
      id: `a-${r.id}`,
      label: `Finalize reflection for ${r.name}`,
      dueDate: r.end_date ?? TODAY.toISOString().slice(0, 10),
      completed: daysUntil(r.end_date ?? TODAY.toISOString().slice(0, 10)) < 0,
    }));

  const totals = rows.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.hours;
    return acc;
  }, {} as Record<ActivityCategory, number>);

  const benchmarkTasks: PersonalTask[] = Object.entries(CATEGORY_MEDIANS)
    .map(([category, median]) => {
      const current = totals[category as ActivityCategory] ?? 0;
      if (current >= median) return null;
      return {
        id: `gap-${category}`,
        label: `Add ${(median - current).toLocaleString()} ${category.toLowerCase()} hours to reach UT median`,
        dueDate: "2026-05-15",
        completed: false,
      };
    })
    .filter((task): task is PersonalTask => Boolean(task))
    .slice(0, 3);

  return [...completionTasks, ...benchmarkTasks];
}

export interface BucketedActionItems {
  thisWeek: ActionItem[];
  thisMonth: ActionItem[];
  upcoming: ActionItem[];
}

export function buildActionItems(
  activities: ActivityRow[],
  deadlines: DeadlineRow[]
): BucketedActionItems {
  const thisWeek: ActionItem[] = [];
  const thisMonth: ActionItem[] = [];
  const upcoming: ActionItem[] = [];

  function bucket(date: string, item: ActionItem) {
    const days = daysUntil(date);
    if (days < 0) return;
    if (days <= 7) thisWeek.push(item);
    else if (days <= 30) thisMonth.push(item);
    else upcoming.push(item);
  }

  // Activity completion → bucketed by end_date.
  activities
    .filter((a) => a.end_date)
    .forEach((a, idx) => {
      const days = daysUntil(a.end_date!);
      if (days < 0) return;
      const priority: Priority = days <= 7 ? "high" : days <= 30 ? "medium" : "low";
      bucket(a.end_date!, {
        id: `act-${a.id}-${idx}`,
        title: `Wrap up reflection for ${a.name}`,
        priority,
        dueDate: fmtDate(a.end_date!),
      });
    });

  // Master deadlines → bucketed by date.
  deadlines.forEach((d, idx) => {
    const days = daysUntil(d.date);
    if (days < 0) return;
    const priority: Priority =
      d.type === "deadline" || d.type === "submission"
        ? "high"
        : days <= 14
        ? "medium"
        : "low";
    bucket(d.date, {
      id: `dl-${d.id}-${idx}`,
      title: d.label,
      priority,
      dueDate: fmtDate(d.date),
    });
  });

  // Hour-gap tasks default to "this month" since they have no hard date.
  const totals = activities.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.hours;
    return acc;
  }, {} as Record<ActivityCategory, number>);

  Object.entries(CATEGORY_MEDIANS).forEach(([category, median], idx) => {
    const current = totals[category as ActivityCategory] ?? 0;
    if (current >= median) return;
    const gap = median - current;
    const priority: Priority =
      category === "Clinical" || category === "Research"
        ? "high"
        : category === "Volunteering" || category === "Shadowing"
        ? "medium"
        : "low";
    thisMonth.push({
      id: `gap-${category}-${idx}`,
      title: `Log ${gap.toLocaleString()} more ${category.toLowerCase()} hours toward UT median`,
      priority,
      dueDate: "Ongoing",
    });
  });

  const sortByPriority = (a: ActionItem, b: ActionItem) =>
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];

  return {
    thisWeek: thisWeek.sort(sortByPriority).slice(0, 6),
    thisMonth: thisMonth.sort(sortByPriority).slice(0, 6),
    upcoming: upcoming.sort(sortByPriority).slice(0, 8),
  };
}
