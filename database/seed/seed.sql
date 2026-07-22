-- Database Seed Script for ModelVerse India

-- Seed initial booking statuses
INSERT INTO public.profiles (id, name, email, role, phone, status) VALUES
('test-client-1', 'Rajesh Kumar', 'rajesh@modelverse.in', 'client', '+919876543210', 'active'),
('test-model-1', 'Aishwarya Sen', 'aishwarya@modelverse.in', 'model', '+918765432109', 'active'),
('test-admin-1', 'Admin Vikram', 'admin@modelverse.in', 'admin', '+917654321098', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed a sample model listing
INSERT INTO public.models (
  id, 
  "userId", 
  name, 
  gender, 
  age, 
  height, 
  city, 
  state, 
  category, 
  approved, 
  "startingPrice"
) VALUES (
  'sample-model-id',
  'test-model-1',
  'Aishwarya Sen',
  'Female',
  24,
  '5 ft 9 in',
  'Mumbai',
  'Maharashtra',
  'High Fashion / Runway',
  true,
  25000
)
ON CONFLICT (id) DO NOTHING;
