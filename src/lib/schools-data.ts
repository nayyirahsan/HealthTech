// Shared school dataset + types. Imported by /schools (table + drawer),
// /schools/[id] (detail page), /schools/compare (side-by-side), and the
// dashboard featured list. Keep this file free of React so it can be used
// from server components and pure logic alike.

export type SchoolType = "MD" | "DO";

export interface UTOutcomeCell {
  applied:     number;
  interviewed: number;
  accepted:    number;
}

export interface School {
  id:             number;
  name:           string;
  abbr:           string;
  state:          string;
  type:           SchoolType;
  medianGPA:      number;
  medianMCAT:     number;
  acceptanceRate: number; // %
  inStateBias:    "High" | "Moderate" | "Low";
  utAcceptRate:   number | null; // % of UT applicants accepted, null = no data
  tuition:        number; // annual in-state $k
  classSize:      number;
  overview:       string;
  secondaries:    { prompt: string; wordLimit: number | null }[];
  prerequisites:  string[];
  utOutcomes:     Record<string, Record<string, UTOutcomeCell>>; // gpa band → mcat band → cell
}

export const GPA_BANDS  = ["3.8–4.0", "3.6–3.79", "3.4–3.59", "< 3.4"];
export const MCAT_BANDS = ["517–528", "510–516", "500–509", "< 500"];

function mockCell(a: number, i: number, ac: number): UTOutcomeCell {
  return { applied: a, interviewed: i, accepted: ac };
}

export const SCHOOLS: School[] = [
  {
    id: 1,
    name: "UT Southwestern Medical School",
    abbr: "UTSW",
    state: "TX",
    type: "MD",
    medianGPA: 3.91,
    medianMCAT: 521,
    acceptanceRate: 4.2,
    inStateBias: "High",
    utAcceptRate: 18,
    tuition: 23,
    classSize: 230,
    overview:
      "UT Southwestern is a flagship Texas research institution consistently ranked top-20. Strong USMLE Step 1 pass rates and excellent residency match outcomes. Heavily favors Texas residents via TMDSAS.",
    secondaries: [
      { prompt: "Describe a challenge you've overcome and what it taught you.", wordLimit: 350 },
      { prompt: "Why UT Southwestern specifically? What draws you to our community?", wordLimit: 300 },
      { prompt: "Discuss your most meaningful research experience.", wordLimit: 400 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Biochemistry", "Physics (2 semesters + lab)", "Math/Statistics", "English (2 semesters)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(12, 9, 7),  "510–516": mockCell(8, 5, 3),  "500–509": mockCell(4, 1, 0),  "< 500": mockCell(1, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(10, 6, 3),  "510–516": mockCell(9, 4, 2),  "500–509": mockCell(5, 1, 0),  "< 500": mockCell(2, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(7, 3, 1),   "510–516": mockCell(6, 2, 0),  "500–509": mockCell(3, 0, 0),  "< 500": mockCell(1, 0, 0) },
      "< 3.4":    { "517–528": mockCell(4, 1, 0),   "510–516": mockCell(3, 0, 0),  "500–509": mockCell(2, 0, 0),  "< 500": mockCell(1, 0, 0) },
    },
  },
  {
    id: 2,
    name: "Baylor College of Medicine",
    abbr: "BCM",
    state: "TX",
    type: "MD",
    medianGPA: 3.93,
    medianMCAT: 522,
    acceptanceRate: 3.1,
    inStateBias: "High",
    utAcceptRate: 12,
    tuition: 26,
    classSize: 185,
    overview:
      "Baylor is one of the most selective medical schools in the country and is tuition-free for most students through endowment scholarships. Exceptional research infrastructure and Houston Medical Center affiliation.",
    secondaries: [
      { prompt: "What experiences have shaped your decision to pursue medicine?", wordLimit: 500 },
      { prompt: "Describe a time you navigated a difficult ethical situation.", wordLimit: 400 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "General Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Physics (2 semesters + lab)", "English (2 semesters)", "Calculus or Statistics"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(15, 8, 5),  "510–516": mockCell(10, 4, 2), "500–509": mockCell(5, 1, 0),  "< 500": mockCell(1, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(12, 5, 2),  "510–516": mockCell(8, 3, 1),  "500–509": mockCell(4, 0, 0),  "< 500": mockCell(1, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(6, 2, 0),   "510–516": mockCell(4, 1, 0),  "500–509": mockCell(2, 0, 0),  "< 500": mockCell(0, 0, 0) },
      "< 3.4":    { "517–528": mockCell(3, 0, 0),   "510–516": mockCell(2, 0, 0),  "500–509": mockCell(1, 0, 0),  "< 500": mockCell(0, 0, 0) },
    },
  },
  {
    id: 3,
    name: "Texas A&M College of Medicine",
    abbr: "TAMU",
    state: "TX",
    type: "MD",
    medianGPA: 3.78,
    medianMCAT: 512,
    acceptanceRate: 7.4,
    inStateBias: "High",
    utAcceptRate: 22,
    tuition: 19,
    classSize: 200,
    overview:
      "Texas A&M COM is a strong Texas TMDSAS school with a collaborative culture and rural medicine emphasis. Newer curriculum with early clinical exposure. Strong match rates to primary care and internal medicine.",
    secondaries: [
      { prompt: "Why Texas A&M? What specifically about our mission resonates with you?", wordLimit: 300 },
      { prompt: "Describe a leadership experience and its impact.", wordLimit: 350 },
      { prompt: "How have you contributed to your community?", wordLimit: 350 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (1 semester + lab)", "Biochemistry", "Physics (2 semesters + lab)", "Statistics or Calculus", "English (2 semesters)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(10, 8, 6),  "510–516": mockCell(12, 9, 7),  "500–509": mockCell(6, 4, 2),  "< 500": mockCell(2, 1, 0) },
      "3.6–3.79": { "517–528": mockCell(14, 10, 7), "510–516": mockCell(15, 11, 8), "500–509": mockCell(8, 4, 2),  "< 500": mockCell(3, 1, 0) },
      "3.4–3.59": { "517–528": mockCell(8, 5, 3),   "510–516": mockCell(9, 6, 3),   "500–509": mockCell(5, 2, 1),  "< 500": mockCell(2, 0, 0) },
      "< 3.4":    { "517–528": mockCell(4, 2, 1),   "510–516": mockCell(5, 2, 1),   "500–509": mockCell(3, 1, 0),  "< 500": mockCell(1, 0, 0) },
    },
  },
  {
    id: 4,
    name: "UT Health Houston — McGovern",
    abbr: "UTH",
    state: "TX",
    type: "MD",
    medianGPA: 3.81,
    medianMCAT: 514,
    acceptanceRate: 5.8,
    inStateBias: "High",
    utAcceptRate: 20,
    tuition: 21,
    classSize: 240,
    overview:
      "McGovern Medical School at UTHealth is one of the largest medical schools in the US with exceptional clinical diversity in the Texas Medical Center. Strong primary care pipeline and community health mission.",
    secondaries: [
      { prompt: "Describe how your background will contribute to diversity at McGovern.", wordLimit: 500 },
      { prompt: "What do you see as the most important issue in healthcare today?", wordLimit: 400 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Biochemistry (recommended)", "Physics (2 semesters + lab)", "Math (2 semesters)", "English (2 semesters)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(11, 9, 6),  "510–516": mockCell(13, 10, 7), "500–509": mockCell(7, 4, 2),  "< 500": mockCell(2, 1, 0) },
      "3.6–3.79": { "517–528": mockCell(13, 9, 6),  "510–516": mockCell(16, 11, 8), "500–509": mockCell(9, 5, 2),  "< 500": mockCell(3, 1, 0) },
      "3.4–3.59": { "517–528": mockCell(7, 4, 2),   "510–516": mockCell(10, 6, 3),  "500–509": mockCell(6, 3, 1),  "< 500": mockCell(2, 0, 0) },
      "< 3.4":    { "517–528": mockCell(3, 1, 0),   "510–516": mockCell(4, 2, 1),   "500–509": mockCell(3, 1, 0),  "< 500": mockCell(1, 0, 0) },
    },
  },
  {
    id: 5,
    name: "Mayo Clinic Alix School of Medicine",
    abbr: "MAYO",
    state: "MN",
    type: "MD",
    medianGPA: 3.92,
    medianMCAT: 522,
    acceptanceRate: 1.9,
    inStateBias: "Low",
    utAcceptRate: 4,
    tuition: 62,
    classSize: 56,
    overview:
      "One of the most selective and prestigious medical schools globally. Tiny class size, full-tuition scholarships for most students, and unparalleled clinical exposure at the #1-ranked Mayo Clinic hospital system.",
    secondaries: [
      { prompt: "Describe a time you contributed to a team. What was your role?", wordLimit: 600 },
      { prompt: "Tell us about a patient interaction that shaped your perspective.", wordLimit: 500 },
      { prompt: "What is your greatest weakness?", wordLimit: 300 },
    ],
    prerequisites: ["Biology (with lab)", "Chemistry (with lab)", "Organic Chemistry (with lab)", "Biochemistry", "Physics (with lab)", "Statistics", "Writing-intensive course"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(8, 3, 1),  "510–516": mockCell(5, 1, 0),  "500–509": mockCell(2, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(6, 1, 0),  "510–516": mockCell(4, 0, 0),  "500–509": mockCell(1, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(3, 0, 0),  "510–516": mockCell(2, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
      "< 3.4":    { "517–528": mockCell(1, 0, 0),  "510–516": mockCell(0, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
    },
  },
  {
    id: 6,
    name: "Johns Hopkins School of Medicine",
    abbr: "JHU",
    state: "MD",
    type: "MD",
    medianGPA: 3.94,
    medianMCAT: 523,
    acceptanceRate: 2.8,
    inStateBias: "Low",
    utAcceptRate: 5,
    tuition: 58,
    classSize: 120,
    overview:
      "Johns Hopkins consistently ranks #1-3 in research and is a pinnacle of academic medicine. Exceptionally selective; expects NIH-level research productivity and strong humanitarian narrative. Nearly full financial aid.",
    secondaries: [
      { prompt: "Describe your most significant research contribution.", wordLimit: null },
      { prompt: "How have your experiences prepared you for a career in academic medicine?", wordLimit: null },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Physics (2 semesters + lab)", "Biochemistry", "Math (1 semester)", "Writing (1 semester)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(6, 2, 1),  "510–516": mockCell(4, 1, 0),  "500–509": mockCell(1, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(5, 1, 0),  "510–516": mockCell(3, 0, 0),  "500–509": mockCell(1, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(2, 0, 0),  "510–516": mockCell(1, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
      "< 3.4":    { "517–528": mockCell(1, 0, 0),  "510–516": mockCell(0, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
    },
  },
  {
    id: 7,
    name: "Texas College of Osteopathic Medicine",
    abbr: "TCOM",
    state: "TX",
    type: "DO",
    medianGPA: 3.64,
    medianMCAT: 505,
    acceptanceRate: 11.2,
    inStateBias: "High",
    utAcceptRate: 28,
    tuition: 17,
    classSize: 175,
    overview:
      "TCOM at UNT Health Science Center is the only public osteopathic school in Texas and one of the most affordable DO programs in the country. Strong primary care focus, excellent rural health training, and Texas-friendly AACOMAS pathway.",
    secondaries: [
      { prompt: "Why osteopathic medicine? Describe what drew you to the DO philosophy.", wordLimit: 500 },
      { prompt: "Tell us about a meaningful community service experience.", wordLimit: 400 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Biochemistry (recommended)", "Physics (2 semesters + lab)", "English (2 semesters)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(5, 4, 3),  "510–516": mockCell(7, 6, 5),  "500–509": mockCell(8, 7, 5), "< 500": mockCell(3, 2, 1) },
      "3.6–3.79": { "517–528": mockCell(8, 7, 5),  "510–516": mockCell(12, 10, 8), "500–509": mockCell(9, 7, 5), "< 500": mockCell(4, 3, 2) },
      "3.4–3.59": { "517–528": mockCell(6, 5, 3),  "510–516": mockCell(9, 7, 5),  "500–509": mockCell(8, 6, 4), "< 500": mockCell(4, 2, 1) },
      "< 3.4":    { "517–528": mockCell(3, 2, 1),  "510–516": mockCell(5, 3, 2),  "500–509": mockCell(6, 4, 2), "< 500": mockCell(3, 1, 0) },
    },
  },
  {
    id: 8,
    name: "University of Michigan Medical School",
    abbr: "UMICH",
    state: "MI",
    type: "MD",
    medianGPA: 3.88,
    medianMCAT: 518,
    acceptanceRate: 5.3,
    inStateBias: "Moderate",
    utAcceptRate: 7,
    tuition: 37,
    classSize: 170,
    overview:
      "University of Michigan is a top-10 research powerhouse with an extremely collaborative curriculum. The Preclerkship program is pass/fail. Strong residency matching across all specialties. Beautiful campus environment.",
    secondaries: [
      { prompt: "Describe a situation where you had to adapt to a difficult circumstance.", wordLimit: 400 },
      { prompt: "What do you hope to contribute to the Michigan medical community?", wordLimit: 400 },
      { prompt: "Tell us about a mentor who influenced your path.", wordLimit: 350 },
    ],
    prerequisites: ["Biology (2 semesters + lab)", "Chemistry (2 semesters + lab)", "Organic Chemistry (2 semesters + lab)", "Biochemistry", "Physics (2 semesters + lab)", "Statistics", "Writing-intensive courses (2)"],
    utOutcomes: {
      "3.8–4.0":  { "517–528": mockCell(7, 4, 2),  "510–516": mockCell(5, 2, 1),  "500–509": mockCell(2, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.6–3.79": { "517–528": mockCell(6, 3, 1),  "510–516": mockCell(5, 2, 0),  "500–509": mockCell(2, 0, 0), "< 500": mockCell(0, 0, 0) },
      "3.4–3.59": { "517–528": mockCell(3, 1, 0),  "510–516": mockCell(3, 1, 0),  "500–509": mockCell(1, 0, 0), "< 500": mockCell(0, 0, 0) },
      "< 3.4":    { "517–528": mockCell(1, 0, 0),  "510–516": mockCell(1, 0, 0),  "500–509": mockCell(0, 0, 0), "< 500": mockCell(0, 0, 0) },
    },
  },
];

export function getSchoolById(id: number): School | undefined {
  return SCHOOLS.find((s) => s.id === id);
}

// UT Outcomes heatmap cell background — maps acceptance rate to burnt-orange
// intensity. Shared between the drawer on /schools and the detail page.
export function heatColor(accepted: number, applied: number): string {
  if (applied === 0 || accepted === 0) return "rgba(255,255,255,0.04)";
  const rate = accepted / applied;
  if (rate >= 0.5) return "rgba(191,87,0,0.70)";
  if (rate >= 0.3) return "rgba(191,87,0,0.45)";
  if (rate >= 0.1) return "rgba(191,87,0,0.22)";
  return "rgba(191,87,0,0.08)";
}
