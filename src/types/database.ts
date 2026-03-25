export interface User {
  id: string;
  email: string;
  full_name: string;
  gpa: number | null;
  science_gpa: number | null;
  mcat_score: number | null;
  mcat_breakdown: {
    chem_phys: number;
    cars: number;
    bio: number;
    psych: number;
  } | null;
  major: string | null;
  residency_state: string | null;
  graduation_year: number | null;
  clinical_hours: number | null;
  research_hours: number | null;
  volunteer_hours: number | null;
  shadowing_hours: number | null;
  created_at: string;
}

export interface School {
  id: number;
  name: string;
  type: "MD" | "DO";
  system: "TMDSAS" | "AMCAS" | "AACOMAS";
  state: string;
  median_gpa: number | null;
  median_mcat: number | null;
  acceptance_rate: number | null;
  class_size: number | null;
  in_state_bias: number | null;
  tuition_in_state: number | null;
  tuition_oos: number | null;
  avg_debt: number | null;
  mission_keywords: string[];
  prereqs: Record<string, unknown> | null;
  website_url: string | null;
  logo_url: string | null;
  updated_at: string;
}

export interface UTOutcome {
  id: number;
  report_year: number;
  application_system: "TMDSAS" | "AMCAS" | "AACOMAS";
  school_name: string;
  gpa_band: string;
  mcat_band: string;
  applicants: number;
  matriculants: number;
  major: string | null;
}

export interface AcceptanceGrid {
  id: number;
  gpa_range: string;
  mcat_range: string;
  acceptance_rate: number;
  source: "AAMC" | "AACOM";
  year: number;
}

export interface SecondaryPrompt {
  id: number;
  school_id: number;
  prompt_text: string;
  word_limit: number | null;
  year: number;
  source: string | null;
}

export interface InterviewData {
  id: number;
  school_id: number;
  format: "MMI" | "Traditional" | "Panel";
  sample_questions: string[];
  tips: string | null;
  source: string | null;
}

export interface SalaryData {
  id: number;
  specialty: string;
  state: string | null;
  metro_area: string | null;
  median_salary: number;
  percentile_25: number;
  percentile_75: number;
  source_year: number;
}

export interface SavedSchool {
  user_id: string;
  school_id: number;
  tier: "reach" | "target" | "safety";
  notes: string | null;
}

export interface ChatMessage {
  id: number;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  context_used: Record<string, unknown> | null;
  created_at: string;
}
