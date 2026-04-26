export type AppStatus = "pre-app" | "applied" | "interviewing" | "accepted";

export interface McatBreakdown {
  chem_phys: number;
  cars: number;
  bio: number;
  psych: number;
}

export interface UserProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  eid: string | null;
  gpa: number | null;
  science_gpa: number | null;
  mcat_score: number | null;
  mcat_breakdown: McatBreakdown | null;
  major: string | null;
  residency_state: string | null;
  graduation_year: number | null;
  app_cycle: string | null;
  clinical_hours: number | null;
  research_hours: number | null;
  volunteer_hours: number | null;
  shadowing_hours: number | null;
  leadership_hours: number | null;
  personal_statement: string | null;
  app_status: AppStatus | null;
  avatar_url: string | null;
  created_at?: string;
}

export type UserProfileUpdate = Partial<Omit<UserProfileRow, "id" | "created_at">>;

export const PROFILE_SELECT = "id,email,full_name,eid,gpa,science_gpa,mcat_score,mcat_breakdown,major,residency_state,graduation_year,app_cycle,clinical_hours,research_hours,volunteer_hours,shadowing_hours,leadership_hours,personal_statement,app_status,avatar_url,created_at";

export function buildProfileSeed(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): UserProfileUpdate & { email: string } {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  return {
    email: user.email ?? "",
    full_name: fullName,
    clinical_hours: 0,
    research_hours: 0,
    volunteer_hours: 0,
    shadowing_hours: 0,
    leadership_hours: 0,
    app_status: "pre-app",
  };
}

export function isOnboardingComplete(profile: UserProfileRow | null | undefined): boolean {
  if (!profile) return false;

  const breakdown = profile.mcat_breakdown;
  const hasBreakdown =
    !!breakdown &&
    [breakdown.chem_phys, breakdown.cars, breakdown.bio, breakdown.psych].every(
      (value) => Number.isFinite(value),
    );

  return Boolean(
    profile.full_name &&
      profile.eid &&
      profile.major &&
      profile.residency_state &&
      profile.app_cycle &&
      profile.app_status &&
      profile.graduation_year != null &&
      profile.gpa != null &&
      profile.science_gpa != null &&
      profile.mcat_score != null &&
      hasBreakdown,
  );
}

export function resolveUserProfile(profile: UserProfileRow | null | undefined) {
  const breakdown = profile?.mcat_breakdown;
  const fullName = profile?.full_name ?? "";

  return {
    id: profile?.id ?? "",
    email: profile?.email ?? "",
    fullName,
    firstName: fullName.split(" ")[0] ?? "",
    eid: profile?.eid ?? "",
    major: profile?.major ?? "",
    residencyState: profile?.residency_state ?? "",
    graduationYear: profile?.graduation_year ?? 0,
    appCycle: profile?.app_cycle ?? "",
    gpa: profile?.gpa ?? 0,
    scienceGpa: profile?.science_gpa ?? 0,
    mcat: profile?.mcat_score ?? 0,
    mcatBreakdown: {
      cp: breakdown?.chem_phys ?? 0,
      cars: breakdown?.cars ?? 0,
      bb: breakdown?.bio ?? 0,
      ps: breakdown?.psych ?? 0,
    },
    clinicalHours: profile?.clinical_hours ?? 0,
    researchHours: profile?.research_hours ?? 0,
    volunteerHours: profile?.volunteer_hours ?? 0,
    shadowingHours: profile?.shadowing_hours ?? 0,
    leadershipHours: profile?.leadership_hours ?? 0,
    personalStatement: profile?.personal_statement ?? "",
    appStatus: profile?.app_status ?? "pre-app",
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export function toProfileUpdate(input: {
  fullName: string;
  eid: string;
  major: string;
  residencyState: string;
  graduationYear: number;
  appCycle: string;
  gpa: number;
  scienceGpa: number;
  mcat: number;
  mcatBreakdown: { cp: number; cars: number; bb: number; ps: number };
  clinicalHours: number;
  researchHours: number;
  volunteerHours: number;
  shadowingHours: number;
  leadershipHours: number;
  personalStatement: string;
  appStatus: AppStatus;
  avatarUrl: string | null;
}): UserProfileUpdate {
  return {
    full_name: input.fullName,
    eid: input.eid,
    major: input.major,
    residency_state: input.residencyState,
    graduation_year: input.graduationYear,
    app_cycle: input.appCycle,
    gpa: input.gpa,
    science_gpa: input.scienceGpa,
    mcat_score: input.mcat,
    mcat_breakdown: {
      chem_phys: input.mcatBreakdown.cp,
      cars: input.mcatBreakdown.cars,
      bio: input.mcatBreakdown.bb,
      psych: input.mcatBreakdown.ps,
    },
    clinical_hours: input.clinicalHours,
    research_hours: input.researchHours,
    volunteer_hours: input.volunteerHours,
    shadowing_hours: input.shadowingHours,
    leadership_hours: input.leadershipHours,
    personal_statement: input.personalStatement,
    app_status: input.appStatus,
    avatar_url: input.avatarUrl,
  };
}

