import { tool } from "@langchain/core/tools";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import type { AdvisorCitation } from "@/lib/ai/types";
import { PROFILE_SELECT, resolveUserProfile, type UserProfileRow } from "@/lib/user-profile";

function optionalTrimmedString() {
  // Important: avoid Zod `.transform()` here — LangChain tool schemas must be JSON-schema serializable for Groq.
  return z.preprocess((value) => {
    if (value === "" || value === null) {
      return undefined;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().optional());
}

function optionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((value) => {
    if (value === "" || value === null) {
      return undefined;
    }

    if (typeof value === "string") {
      return value.trim();
    }

    return value;
  }, z.enum(values).optional());
}

interface CreateAdvisorToolsParams {
  supabase: SupabaseClient;
  user: User;
  onCitation: (citation: AdvisorCitation) => void;
}

function summarizeProfile(profile: UserProfileRow | null) {
  if (!profile) {
    return "No saved user profile was found.";
  }

  const resolved = resolveUserProfile(profile);

  return JSON.stringify({
    id: resolved.id,
    fullName: resolved.fullName,
    major: resolved.major,
    residencyState: resolved.residencyState,
    graduationYear: resolved.graduationYear,
    appCycle: resolved.appCycle,
    appStatus: resolved.appStatus,
    gpa: resolved.gpa,
    scienceGpa: resolved.scienceGpa,
    mcat: resolved.mcat,
    mcatBreakdown: resolved.mcatBreakdown,
    clinicalHours: resolved.clinicalHours,
    researchHours: resolved.researchHours,
    volunteerHours: resolved.volunteerHours,
    shadowingHours: resolved.shadowingHours,
    leadershipHours: resolved.leadershipHours,
    personalStatementPresent: Boolean(resolved.personalStatement?.trim()),
  });
}

async function loadSchoolByNameOrId(
  supabase: SupabaseClient,
  input: { schoolId?: number; schoolName?: string },
) {
  if (input.schoolId != null) {
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("id", input.schoolId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  if (!input.schoolName?.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .ilike("name", `%${input.schoolName.trim()}%`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function loadCurrentUserProfile(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle<UserProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}

export function buildUserSummary(profile: UserProfileRow | null) {
  if (!profile) {
    return "The user is authenticated but has no saved profile row yet.";
  }

  const resolved = resolveUserProfile(profile);

  return [
    `Name: ${resolved.fullName}`,
    `Major: ${resolved.major}`,
    `Residency: ${resolved.residencyState}`,
    `Graduation year: ${resolved.graduationYear}`,
    `Application cycle: ${resolved.appCycle}`,
    `Application status: ${resolved.appStatus}`,
    `GPA: ${resolved.gpa.toFixed(2)}`,
    `Science GPA: ${resolved.scienceGpa.toFixed(2)}`,
    `MCAT: ${resolved.mcat}`,
    `MCAT breakdown: CP ${resolved.mcatBreakdown.cp}, CARS ${resolved.mcatBreakdown.cars}, BB ${resolved.mcatBreakdown.bb}, PS ${resolved.mcatBreakdown.ps}`,
    `Hours: clinical ${resolved.clinicalHours}, research ${resolved.researchHours}, volunteer ${resolved.volunteerHours}, shadowing ${resolved.shadowingHours}, leadership ${resolved.leadershipHours}`,
    `Personal statement on file: ${resolved.personalStatement?.trim() ? "yes" : "no"}`,
  ].join("\n");
}

export function createAdvisorTools({
  supabase,
  user,
  onCitation,
}: CreateAdvisorToolsParams) {
  return [
    tool(
      async () => {
        const profile = await loadCurrentUserProfile(supabase, user.id);

        onCitation({
          type: "profile",
          label: "Your saved profile",
          detail: "Pulled from the users table for your GPA, MCAT, residency, app cycle, and experience hours.",
          table: "users",
          recordIds: [user.id],
        });

        return summarizeProfile(profile);
      },
      {
        name: "get_user_profile",
        description: "Fetch the current authenticated user's saved profile and application stats.",
        schema: z.object({}),
      },
    ),
    tool(
      async () => {
        const { data, error } = await supabase
          .from("saved_schools")
          .select("school_id, tier, notes")
          .eq("user_id", user.id)
          .limit(25);

        if (error) throw error;

        const schoolIds = (data ?? []).map((row) => row.school_id).filter((value): value is number => value != null);

        let schools: Array<Record<string, unknown>> = [];
        if (schoolIds.length > 0) {
          const { data: schoolRows, error: schoolError } = await supabase
            .from("schools")
            .select("id, name, type, system, state, median_gpa, median_mcat, acceptance_rate")
            .in("id", schoolIds);

          if (schoolError) throw schoolError;
          schools = schoolRows ?? [];
        }

        onCitation({
          type: "saved_schools",
          label: "Your saved schools",
          detail: "Read from your saved_schools entries and linked school records.",
          table: "saved_schools",
          recordIds: schoolIds,
        });

        return JSON.stringify({
          count: data?.length ?? 0,
          saved: data ?? [],
          schoolDetails: schools,
        });
      },
      {
        name: "get_saved_schools",
        description: "Fetch the authenticated user's saved school list, tiers, notes, and linked school stats.",
        schema: z.object({}),
      },
    ),
    tool(
      async ({ query, state, system, type, limit }) => {
        let request = supabase
          .from("schools")
          .select("id, name, type, system, state, median_gpa, median_mcat, acceptance_rate, class_size, tuition_in_state, tuition_oos, mission_keywords")
          .order("name")
          .limit(limit);

        if (query?.trim()) {
          request = request.ilike("name", `%${query.trim()}%`);
        }
        if (state?.trim()) {
          request = request.eq("state", state.trim().toUpperCase());
        }
        if (system) {
          request = request.eq("system", system);
        }
        if (type) {
          request = request.eq("type", type);
        }

        const { data, error } = await request;
        if (error) throw error;

        onCitation({
          type: "schools",
          label: "School database",
          detail: "Reference school stats from the schools table, including medians, rates, tuition, and mission keywords.",
          table: "schools",
          recordIds: (data ?? []).map((row) => row.id),
        });

        return JSON.stringify(data ?? []);
      },
      {
        name: "search_schools",
        description: "Search schools by name and optional state, system, or MD/DO type.",
        schema: z.object({
          query: optionalTrimmedString().describe("Partial school name."),
          state: optionalTrimmedString().describe("Two-letter state code like TX."),
          system: optionalEnum(["TMDSAS", "AMCAS", "AACOMAS"]),
          type: optionalEnum(["MD", "DO"]),
          limit: z.number().int().min(1).max(20).default(8),
        }),
      },
    ),
    tool(
      async ({ schoolId, schoolName }) => {
        const school = await loadSchoolByNameOrId(supabase, { schoolId, schoolName });

        if (!school) {
          return JSON.stringify({ error: "School not found" });
        }

        onCitation({
          type: "schools",
          label: school.name,
          detail: "Detailed school record from the schools table.",
          table: "schools",
          recordIds: [school.id],
        });

        return JSON.stringify(school);
      },
      {
        name: "get_school_details",
        description: "Fetch a single school's detailed record by id or approximate name.",
        schema: z.object({
          schoolId: z.number().int().optional(),
          schoolName: optionalTrimmedString(),
        }),
      },
    ),
    tool(
      async ({ schoolName, applicationSystem, gpaBand, mcatBand, reportYear, limit }) => {
        let request = supabase
          .from("ut_outcomes")
          .select("*")
          .order("report_year", { ascending: false })
          .limit(limit);

        if (schoolName?.trim()) {
          request = request.ilike("school_name", `%${schoolName.trim()}%`);
        }
        if (applicationSystem) {
          request = request.eq("application_system", applicationSystem);
        }
        if (gpaBand?.trim()) {
          request = request.eq("gpa_band", gpaBand.trim());
        }
        if (mcatBand?.trim()) {
          request = request.eq("mcat_band", mcatBand.trim());
        }
        if (reportYear != null) {
          request = request.eq("report_year", reportYear);
        }

        const { data, error } = await request;
        if (error) throw error;

        onCitation({
          type: "ut_outcomes",
          label: "UT HPO outcomes",
          detail: "Filtered records from the ut_outcomes table for school-specific or band-specific UT outcomes.",
          table: "ut_outcomes",
          recordIds: (data ?? []).map((row) => row.id),
        });

        return JSON.stringify(data ?? []);
      },
      {
        name: "get_ut_outcomes",
        description: "Fetch UT Austin outcome rows by school, application system, GPA band, MCAT band, or report year.",
        schema: z.object({
          schoolName: optionalTrimmedString(),
          applicationSystem: optionalEnum(["TMDSAS", "AMCAS", "AACOMAS"]),
          gpaBand: optionalTrimmedString(),
          mcatBand: optionalTrimmedString(),
          reportYear: z.number().int().optional(),
          limit: z.number().int().min(1).max(50).default(20),
        }),
      },
    ),
    tool(
      async ({ source, gpaRange, mcatRange, year, limit }) => {
        let request = supabase
          .from("acceptance_grid")
          .select("*")
          .order("year", { ascending: false })
          .limit(limit);

        if (source) {
          request = request.eq("source", source);
        }
        if (gpaRange?.trim()) {
          request = request.eq("gpa_range", gpaRange.trim());
        }
        if (mcatRange?.trim()) {
          request = request.eq("mcat_range", mcatRange.trim());
        }
        if (year != null) {
          request = request.eq("year", year);
        }

        const { data, error } = await request;
        if (error) throw error;

        onCitation({
          type: "acceptance_grid",
          label: "Acceptance grid",
          detail: "Rows from the acceptance_grid table for broad GPA and MCAT acceptance context.",
          table: "acceptance_grid",
          recordIds: (data ?? []).map((row) => row.id),
        });

        return JSON.stringify(data ?? []);
      },
      {
        name: "get_acceptance_grid",
        description: "Fetch AAMC or AACOM acceptance-grid rows by GPA range, MCAT range, and year.",
        schema: z.object({
          source: optionalEnum(["AAMC", "AACOM"]),
          gpaRange: optionalTrimmedString(),
          mcatRange: optionalTrimmedString(),
          year: z.number().int().optional(),
          limit: z.number().int().min(1).max(30).default(12),
        }),
      },
    ),
    tool(
      async ({ schoolId, schoolName }) => {
        const school = await loadSchoolByNameOrId(supabase, { schoolId, schoolName });

        if (!school) {
          return JSON.stringify({ error: "School not found" });
        }

        const { data, error } = await supabase
          .from("interview_data")
          .select("*")
          .eq("school_id", school.id)
          .limit(10);

        if (error) throw error;

        onCitation({
          type: "interview_data",
          label: `${school.name} interview data`,
          detail: "Interview records linked to the selected school from the interview_data table.",
          table: "interview_data",
          recordIds: (data ?? []).map((row) => row.id),
        });

        return JSON.stringify({
          school: {
            id: school.id,
            name: school.name,
            type: school.type,
            system: school.system,
            state: school.state,
          },
          interviews: data ?? [],
        });
      },
      {
        name: "get_interview_data",
        description: "Fetch interview format, sample questions, and tips for a specific school.",
        schema: z.object({
          schoolId: z.number().int().optional(),
          schoolName: optionalTrimmedString(),
        }),
      },
    ),
  ];
}
