-- Seed data: sample medical schools for development
insert into public.schools (name, type, system, state, median_gpa, median_mcat, acceptance_rate, class_size, tuition_in_state, tuition_oos, website_url) values
  ('Dell Medical School', 'MD', 'TMDSAS', 'TX', 3.82, 517, 3.2, 50, 19200, 32200, 'https://dellmed.utexas.edu'),
  ('Baylor College of Medicine', 'MD', 'TMDSAS', 'TX', 3.90, 520, 3.8, 186, 23600, 36600, 'https://www.bcm.edu'),
  ('UT Southwestern Medical Center', 'MD', 'TMDSAS', 'TX', 3.85, 518, 5.1, 240, 18700, 31700, 'https://www.utsouthwestern.edu'),
  ('McGovern Medical School (UTHealth)', 'MD', 'TMDSAS', 'TX', 3.78, 515, 6.2, 240, 18800, 31800, 'https://med.uth.edu'),
  ('Harvard Medical School', 'MD', 'AMCAS', 'MA', 3.93, 521, 3.3, 165, 66000, 66000, 'https://hms.harvard.edu');

-- Sample acceptance grid data (AAMC)
insert into public.acceptance_grid (gpa_range, mcat_range, acceptance_rate, source, year) values
  ('3.80-4.00', '517-528', 82.4, 'AAMC', 2023),
  ('3.80-4.00', '514-516', 67.2, 'AAMC', 2023),
  ('3.80-4.00', '510-513', 55.1, 'AAMC', 2023),
  ('3.60-3.79', '517-528', 69.8, 'AAMC', 2023),
  ('3.60-3.79', '514-516', 52.3, 'AAMC', 2023),
  ('3.60-3.79', '510-513', 40.7, 'AAMC', 2023),
  ('3.40-3.59', '517-528', 55.6, 'AAMC', 2023),
  ('3.40-3.59', '514-516', 39.1, 'AAMC', 2023),
  ('3.40-3.59', '510-513', 29.3, 'AAMC', 2023);
