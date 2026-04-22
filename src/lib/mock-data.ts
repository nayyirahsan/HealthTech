// Canonical user profile + benchmarks. All pages should read from here so
// the dashboard, profile, activities, ut-benchmarks, and next-steps pages
// stay consistent.

export const userProfile = {
  // Identity
  fullName: "Alex Rivera",
  firstName: "Alex",
  eid: "ar28492",
  major: "Biology",
  residencyState: "TX",
  graduationYear: 2027,
  appCycle: "2026–2027",
  // Academics
  gpa: 3.75,
  scienceGpa: 3.68,
  mcat: 512,
  mcatBreakdown: { cp: 128, cars: 127, bb: 130, ps: 127 },
  // Hours
  clinicalHours: 850,
  researchHours: 400,
  volunteerHours: 180,
  shadowingHours: 90,
  leadershipHours: 45,
};

// ISO dates for the 2026–27 cycle. Read by the dashboard to compute
// days-to-cycle countdowns instead of hardcoding them.
export const cycleDates = {
  tmdsasOpens: "2026-05-01",
  amcasOpens:  "2026-05-27",
};

export const utMedian = {
  gpa: 3.82,
  scienceGpa: 3.75,
  mcat: 513,
  clinicalHours: 1200,
  researchHours: 600,
  volunteerHours: 250,
  shadowingHours: 120,
  leadershipHours: 75,
};

// ─── Legacy snake_case view for /next-steps ──────────────────────────────────

export const mockUser = {
  full_name: userProfile.fullName,
  gpa: userProfile.gpa,
  science_gpa: userProfile.scienceGpa,
  mcat_score: userProfile.mcat,
  mcat_breakdown: {
    chem_phys: userProfile.mcatBreakdown.cp,
    cars: userProfile.mcatBreakdown.cars,
    bio: userProfile.mcatBreakdown.bb,
    psych: userProfile.mcatBreakdown.ps,
  },
  major: userProfile.major,
  residency_state: userProfile.residencyState,
  graduation_year: userProfile.graduationYear,
  clinical_hours: userProfile.clinicalHours,
  research_hours: userProfile.researchHours,
  volunteer_hours: userProfile.volunteerHours,
  shadowing_hours: userProfile.shadowingHours,
};

export const gpaComparisonData = [
  { label: "You", gpa: userProfile.gpa, sciGpa: userProfile.scienceGpa },
  { label: "UT Avg", gpa: 3.78, sciGpa: 3.71 },
  { label: "TMDSAS Med", gpa: 3.75, sciGpa: 3.68 },
  { label: "Top 10 Med", gpa: 3.91, sciGpa: 3.88 },
];

export const mcatSectionData = [
  { section: "C/P", you: userProfile.mcatBreakdown.cp, median: 127 },
  { section: "CARS", you: userProfile.mcatBreakdown.cars, median: 126 },
  { section: "B/B", you: userProfile.mcatBreakdown.bb, median: 128 },
  { section: "P/S", you: userProfile.mcatBreakdown.ps, median: 127 },
];

export const activityHoursData = [
  { category: "Clinical", hours: userProfile.clinicalHours, benchmark: 500 },
  { category: "Research", hours: userProfile.researchHours, benchmark: 400 },
  { category: "Volunteer", hours: userProfile.volunteerHours, benchmark: 200 },
  { category: "Shadowing", hours: userProfile.shadowingHours, benchmark: 80 },
];

export const mockDeadlines = [
  { id: 1, title: "MCAT Registration Opens", date: "Apr 15, 2026", system: "MCAT", daysAway: 8, urgent: true },
  { id: 2, title: "TMDSAS Opens", date: "May 1, 2026", system: "TMDSAS", daysAway: 24, urgent: false },
  { id: 3, title: "AMCAS Opens", date: "May 27, 2026", system: "AMCAS", daysAway: 50, urgent: false },
  { id: 4, title: "TMDSAS Primary Deadline", date: "Oct 1, 2026", system: "TMDSAS", daysAway: 177, urgent: false },
];

export const mockRecommendations = [
  {
    id: 1,
    title: "Boost clinical hours to 500+",
    description: "You're at 320 hours. Most competitive TX applicants have 500+. Consider adding a new clinical volunteering role this summer.",
    priority: "high" as const,
    category: "Activities",
    visual: "activity" as const,
  },
  {
    id: 2,
    title: "Register for your MCAT date",
    description: "Registration opens April 15. Secure your preferred June test date early — popular dates fill fast.",
    priority: "high" as const,
    category: "Testing",
    visual: "mcat" as const,
  },
  {
    id: 3,
    title: "Draft your personal statement",
    description: "Start outlining your narrative now. TMDSAS opens May 1 — having a draft ready gives you a head start.",
    priority: "medium" as const,
    category: "Application",
    visual: "deadlines" as const,
  },
  {
    id: 4,
    title: "Request letters of recommendation",
    description: "Reach out to 2 science professors and 1 clinical mentor. Give them at least 6 weeks' notice.",
    priority: "medium" as const,
    category: "Application",
    visual: "gpa" as const,
  },
  {
    id: 5,
    title: "Build your school list",
    description: "Your stats match well with several TX schools. Use the School Explorer to build a balanced list of 15–20 schools.",
    priority: "low" as const,
    category: "Research",
    visual: "gpa" as const,
  },
];

export const mockActionItems = {
  thisWeek: [
    { id: 1, title: "Register for MCAT", priority: "high" as const, dueDate: "Apr 15" },
    { id: 2, title: "Email Dr. Chen for letter of recommendation", priority: "high" as const, dueDate: "Apr 12" },
  ],
  thisMonth: [
    { id: 3, title: "Start personal statement outline", priority: "medium" as const, dueDate: "Apr 30" },
    { id: 4, title: "Shadow Dr. Patel (cardiology) — 2 shifts remaining", priority: "medium" as const, dueDate: "Apr 20" },
    { id: 5, title: "Complete CASPer preparation module", priority: "low" as const, dueDate: "Apr 28" },
  ],
  upcoming: [
    { id: 6, title: "Submit TMDSAS primary application", priority: "high" as const, dueDate: "May 15" },
    { id: 7, title: "Build school list (15–20 schools)", priority: "medium" as const, dueDate: "May 10" },
    { id: 8, title: "Finalize activity descriptions (15 entries)", priority: "medium" as const, dueDate: "May 5" },
    { id: 9, title: "Complete secondary essay pre-writes", priority: "low" as const, dueDate: "Jun 15" },
  ],
};
