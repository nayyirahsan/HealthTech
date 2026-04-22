-- Seed data: sample medical schools for development
insert into public.schools (name, type, system, state, median_gpa, median_mcat, acceptance_rate, class_size, tuition_in_state, tuition_oos, website_url) values
  ('Dell Medical School', 'MD', 'TMDSAS', 'TX', 3.82, 517, 3.2, 50, 19200, 32200, 'https://dellmed.utexas.edu'),
  ('Baylor College of Medicine', 'MD', 'TMDSAS', 'TX', 3.90, 520, 3.8, 186, 23600, 36600, 'https://www.bcm.edu'),
  ('UT Southwestern Medical Center', 'MD', 'TMDSAS', 'TX', 3.85, 518, 5.1, 240, 18700, 31700, 'https://www.utsouthwestern.edu'),
  ('McGovern Medical School (UTHealth)', 'MD', 'TMDSAS', 'TX', 3.78, 515, 6.2, 240, 18800, 31800, 'https://med.uth.edu'),
  ('Harvard Medical School', 'MD', 'AMCAS', 'MA', 3.93, 521, 3.3, 165, 66000, 66000, 'https://hms.harvard.edu')
on conflict (name) do update set
  type = excluded.type,
  system = excluded.system,
  state = excluded.state,
  median_gpa = excluded.median_gpa,
  median_mcat = excluded.median_mcat,
  acceptance_rate = excluded.acceptance_rate,
  class_size = excluded.class_size,
  tuition_in_state = excluded.tuition_in_state,
  tuition_oos = excluded.tuition_oos,
  website_url = excluded.website_url;

-- Sample acceptance grid data (AAMC)
insert into public.acceptance_grid (gpa_range, mcat_range, acceptance_rate, source, year)
select v.gpa_range, v.mcat_range, v.acceptance_rate, v.source, v.year
from (
  values
    ('3.80-4.00', '517-528', 82.4, 'AAMC', 2023),
    ('3.80-4.00', '514-516', 67.2, 'AAMC', 2023),
    ('3.80-4.00', '510-513', 55.1, 'AAMC', 2023),
    ('3.60-3.79', '517-528', 69.8, 'AAMC', 2023),
    ('3.60-3.79', '514-516', 52.3, 'AAMC', 2023),
    ('3.60-3.79', '510-513', 40.7, 'AAMC', 2023),
    ('3.40-3.59', '517-528', 55.6, 'AAMC', 2023),
    ('3.40-3.59', '514-516', 39.1, 'AAMC', 2023),
    ('3.40-3.59', '510-513', 29.3, 'AAMC', 2023)
) as v(gpa_range, mcat_range, acceptance_rate, source, year)
where not exists (
  select 1
  from public.acceptance_grid ag
  where ag.gpa_range = v.gpa_range
    and ag.mcat_range = v.mcat_range
    and ag.source = v.source
    and ag.year = v.year
);

-- Sample activities for Activities + Timeline pages
insert into public.activities (name, category, hours, start_date, end_date, organization, description, most_meaningful)
select v.name, v.category, v.hours, v.start_date, v.end_date, v.organization, v.description, v.most_meaningful
from (
  values
    ('Emergency Department Volunteer', 'Clinical', 340, '2023-06-01'::date, '2024-05-31'::date, 'Dell Seton Medical Center at UT Austin', 'Assisted nursing staff with patient transport, chart prep, and patient-family communication in a Level I trauma center.', true),
    ('Neuroinflammation Research Coordinator', 'Research', 280, '2023-09-01'::date, '2024-12-31'::date, 'UT Austin Waggoner Center', 'Coordinated participant recruitment and sample tracking for a neuroinflammation project.', true),
    ('Free Clinic Medical Interpreter', 'Volunteering', 180, '2022-09-01'::date, '2024-05-15'::date, 'People''s Community Clinic', 'Provided Spanish-English interpretation during outpatient primary care visits.', true),
    ('Physician Shadowing — Internal Medicine', 'Shadowing', 120, '2023-01-10'::date, '2023-08-20'::date, 'Austin Internal Medicine Associates', 'Observed continuity clinic and inpatient rounds across internal medicine services.', false),
    ('Pre-Medical Society President', 'Leadership', 200, '2023-05-01'::date, '2024-05-01'::date, 'UT Austin Pre-Medical Society', 'Led programming, mentorship, and physician panel coordination for 400+ members.', false)
) as v(name, category, hours, start_date, end_date, organization, description, most_meaningful)
where not exists (
  select 1
  from public.activities a
  where a.name = v.name
    and a.organization = v.organization
    and a.start_date = v.start_date
);

-- Official cycle deadlines (AAMC/TMDSAS) for timeline UI
insert into public.application_deadlines (key, label, date, system, type, description, completed)
values
  ('amcas-opens',         'AMCAS Application Opens',            '2025-05-01', 'AMCAS',  'milestone',  'Portal opens; applicants can start primary applications.', true),
  ('tmdsas-opens',        'TMDSAS Application Opens',           '2025-05-01', 'TMDSAS', 'milestone',  'Texas application portal opens.', true),
  ('amcas-first-submit',  'AMCAS First Day to Submit',          '2025-06-03', 'AMCAS',  'submission', 'Earliest submission date for AMCAS primary applications.', true),
  ('tmdsas-first-submit', 'TMDSAS First Day to Submit',         '2025-07-15', 'TMDSAS', 'submission', 'Earliest submission date for TMDSAS primary applications.', true),
  ('tmdsas-deadline',     'TMDSAS Application Deadline',        '2025-10-01', 'TMDSAS', 'deadline',   'Final TMDSAS submission deadline.', true),
  ('amcas-regular',       'AMCAS Regular Deadline (Most Schools)','2025-11-15','AMCAS', 'deadline',   'Common AMCAS regular decision deadline for many schools.', true),
  ('amcas-late',          'AMCAS Late Deadline (Late Schools)', '2026-01-15', 'AMCAS',  'deadline',   'Late-deadline programs close around this date.', true),
  ('aamc-hold',           'AAMC Multiple Acceptance Hold',      '2026-04-15', 'AMCAS',  'deadline',   'Applicants should narrow active acceptances by this date.', false),
  ('acceptance-day',      'Acceptance Day — Final Decision',    '2026-05-15', 'Both',   'milestone',  'Deposit and commit deadline for most accepted students.', false),
  ('cycle-ends',          'Application Cycle Ends',             '2026-06-30', 'Both',   'milestone',  'Current application cycle closes.', false)
on conflict (key) do update set
  label = excluded.label,
  date = excluded.date,
  system = excluded.system,
  type = excluded.type,
  description = excluded.description,
  completed = excluded.completed;

-- Seed school tracker from real schools dataset (no fabricated outcomes)
insert into public.school_applications (school_name, school_abbr, system)
select
  s.name,
  left(regexp_replace(upper(s.name), '[^A-Z]', '', 'g'), 5),
  case when s.system = 'TMDSAS' then 'TMDSAS' else 'AMCAS' end
from public.schools s
where s.system in ('TMDSAS', 'AMCAS')
  and not exists (
    select 1
    from public.school_applications sa
    where sa.school_name = s.name
  );

-- Curated opportunities dataset
insert into public.opportunities
  (name, org, category, mode, affiliation, location, weekly_hours, metric, competitive, description, requirements, apply_url, recommended, recommend_reason)
values
  ('Dell Seton Medical Center Volunteer', 'Ascension Seton', 'Clinical', 'In-Person', 'Community', 'Austin, TX', 6, 'Clinical Hours', 2, 'Provide direct patient support on medical/surgical floors and assist nursing staff with care logistics.', '{"18+ years old","Background check","TB test","Orientation required"}', 'https://www.ascension.org', true, 'High-yield clinical exposure with consistent weekly hours.'),
  ('UT Austin Undergraduate Research Apprentice Program', 'UT Austin Office of Undergraduate Research', 'Research', 'In-Person', 'UT-Affiliated', 'Austin, TX', 10, 'Research Hours', 3, 'Faculty-mentored semester research placements with strong publication and recommendation potential.', '{"Enrolled UT student","Faculty mentor required"}', 'https://ugs.utexas.edu/ura', true, 'Excellent way to build sustained research depth quickly.'),
  ('CommUnity Care Patient Navigator', 'CommUnity Care', 'Volunteering', 'In-Person', 'Community', 'Austin, TX', 4, 'Volunteer Hours', 2, 'Support underserved patients with scheduling, follow-up, and care navigation.', '{"HIPAA training","Reliable transportation"}', 'https://communitycaretx.org', true, 'Strong mission-fit community service with direct social impact.'),
  ('UT Health Austin Physician Shadowing Program', 'UT Health Austin', 'Shadowing', 'In-Person', 'UT-Affiliated', 'Austin, TX', 3, 'Shadowing Hours', 3, 'Structured specialty shadowing rotations with physician feedback.', '{"Premed advisor approval","Program orientation"}', 'https://uthealthaustin.org', false, null),
  ('UT BME Undergraduate Research Assistant', 'UT Biomedical Engineering', 'Research', 'In-Person', 'UT-Affiliated', 'Austin, TX', 12, 'Research Hours', 4, 'Lab assistant roles across translational engineering and clinical innovation teams.', '{"Relevant lab coursework preferred"}', 'https://www.bme.utexas.edu', false, null),
  ('Austin Free Clinic Intake Volunteer', 'Austin Free Clinic', 'Clinical', 'In-Person', 'Community', 'Austin, TX', 3, 'Clinical Hours', 1, 'Support patient intake and clinic operations in an underserved setting.', '{"CPR certification preferred"}', 'https://www.austinfreeclinic.org', false, null),
  ('Virtual Medical Scribe', 'ScribeAmerica', 'Clinical', 'Remote', 'Community', 'Remote', 8, 'Clinical Hours', 2, 'Remote charting and documentation support for telehealth physician encounters.', '{"Typing proficiency","HIPAA compliance training"}', 'https://www.scribeamerica.com', false, null),
  ('Longhorn Pre-Med Society Officer', 'UT Longhorn Pre-Med Society', 'Leadership', 'In-Person', 'UT-Affiliated', 'Austin, TX', 5, 'Volunteer Hours', 3, 'Leadership role organizing events, mentorship, and premed programming.', '{"Active member status"}', 'https://www.utlpm.org', false, null),
  ('St. David''s ED Volunteer', 'St. David''s HealthCare', 'Clinical', 'In-Person', 'Community', 'Austin, TX', 4, 'Clinical Hours', 2, 'Emergency department volunteer experience in a high-volume acute care environment.', '{"Health screening","Minimum shift commitment"}', 'https://stdavids.com', false, null),
  ('Mano Amiga Tutoring Coordinator', 'Mano Amiga', 'Leadership', 'Hybrid', 'Community', 'Austin, TX', 4, 'Volunteer Hours', 2, 'Coordinate volunteers and education support for first-generation students.', '{"Spanish preferred"}', 'https://www.manoamiga.org', false, null)
on conflict do nothing;

-- UT benchmark medians from HPO reports
insert into public.ut_benchmarks (metric, median_value, source)
values
  ('gpa', 3.82, 'UT HPO Reports 2021-2023'),
  ('mcat', 513, 'UT HPO Reports 2021-2023'),
  ('clinical_hours', 1200, 'UT HPO Reports 2021-2023'),
  ('research_hours', 600, 'UT HPO Reports 2021-2023'),
  ('volunteer_hours', 250, 'UT HPO Reports 2021-2023'),
  ('shadowing_hours', 120, 'UT HPO Reports 2021-2023')
on conflict (metric) do update set
  median_value = excluded.median_value,
  source = excluded.source,
  updated_at = now();
