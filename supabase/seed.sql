-- Insert Pilot District
INSERT INTO public.districts (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'East Godavari')
ON CONFLICT (name) DO NOTHING;

-- Insert Pilot Mandals
INSERT INTO public.mandals (id, district_id, name) VALUES 
  ('22222222-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Peddapuram'),
  ('22222222-1111-1111-1111-222222222222', '11111111-1111-1111-1111-111111111111', 'Samalkota')
ON CONFLICT (district_id, name) DO NOTHING;

-- Insert Pilot Villages
INSERT INTO public.villages (mandal_id, name) VALUES 
  ('22222222-1111-1111-1111-111111111111', 'Peddapuram'),
  ('22222222-1111-1111-1111-111111111111', 'Divipalli'),
  ('22222222-1111-1111-1111-222222222222', 'Samalkota'),
  ('22222222-1111-1111-1111-222222222222', 'Virava')
ON CONFLICT (mandal_id, name) DO NOTHING;

-- Insert Pilot Services
INSERT INTO public.services (title, description, required_documents, stages, is_active) VALUES
  (
    'Birth Certificate', 
    'Official registration of birth',
    '[{"nameEn": "Aadhaar", "isRequired": true}, {"nameEn": "Hospital Receipt", "isRequired": true}]'::jsonb,
    '["apply", "review", "issue"]'::jsonb,
    true
  ),
  (
    'Income Certificate',
    'Proof of annual income for scholarships and schemes',
    '[{"nameEn": "Aadhaar", "isRequired": true}, {"nameEn": "Employer Letter", "isRequired": true}]'::jsonb,
    '["apply", "verify", "issue"]'::jsonb,
    true
  ),
  (
    'Caste Certificate',
    'Official proof of caste',
    '[{"nameEn": "Aadhaar", "isRequired": true}, {"nameEn": "Prior Certificate / Transfer Certificate", "isRequired": true}]'::jsonb,
    '["apply", "review", "issue"]'::jsonb,
    true
  );
