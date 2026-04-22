export interface AdvisorCitation {
  type: "profile" | "saved_schools" | "schools" | "ut_outcomes" | "acceptance_grid" | "interview_data";
  label: string;
  detail: string;
  table?: string;
  recordIds?: Array<number | string>;
}

export interface AdvisorResponse {
  reply: string;
  citations: AdvisorCitation[];
}
