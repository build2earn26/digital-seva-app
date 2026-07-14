-- Seed sample services so the rural feed has content to sort/filter/search.
-- Safe to re-run: uses ON CONFLICT on title.

insert into public.services (title, description, category, subcategory, tags, academic_track, popularity, is_active)
values
  ('Income Certificate', 'Proof of annual income for BPL / subsidy schemes.', 'certificate', 'income',
   array['income','bpl','aadhar','ration'], 'general', 95, true),
  ('Caste Certificate', 'Community / caste certificate for reservations.', 'certificate', 'caste',
   array['caste','community'], 'general', 88, true),
  ('Birth Certificate', 'Official record of birth.', 'certificate', 'birth',
   array['birth','dob','जन्म'], 'general', 82, true),
  ('Death Certificate', 'Official record of death.', 'certificate', 'death',
   array['death','मृत्यु'], 'general', 60, true),
  ('Ration Card (PDS)', 'Food security / subsidized ration access.', 'welfare', 'ration',
   array['ration','pds','food','bpl'], 'general', 90, true),
  ('Old Age Pension', 'Monthly pension for elderly citizens.', 'welfare', 'pension',
   array['pension','वृद्ध','oldage'], 'general', 78, true),
  ('Pre-Matric Scholarship', 'Scholarship for school students (Class 1–10).', 'education', 'scholarship',
   array['scholarship','scholar','study'], 'school', 85, true),
  ('Post-Matric Scholarship', 'Scholarship for college / higher-education students.', 'education', 'scholarship',
   array['scholarship','scholar','study'], 'higher_ed', 80, true),
  ('ITI / Vocational Training', 'Skill training at Industrial Training Institutes.', 'skill', 'vocational',
   array['vocational','iti','skill','diploma'], 'vocational', 72, true),
  ('Short-Term Skill Course', 'Free short skill courses (tailoring, wiring, etc.).', 'skill', 'training',
   array['skill','training'], 'skill', 68, true),
  ('Land Patta / Record', 'Land ownership record / patta.', 'land', 'property',
   array['land','property','patta','जमीन'], 'general', 65, true),
  ('Water Connection', 'New drinking-water / Jal connection.', 'utility', 'water',
   array['water','jal','जल'], 'general', 55, true),
  ('Police Complaint (FIR)', 'File a police complaint online.', 'public-safety', 'fir',
   array['police','fir','complaint'], 'general', 50, true)
on conflict (title) do nothing;
