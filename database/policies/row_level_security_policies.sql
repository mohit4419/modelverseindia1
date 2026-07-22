-- RLS Policies for secure multi-tenant access on ModelVerse tables

-- 1. Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to profiles" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Allow users to update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid()::text = id);


-- 2. Models table policies
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to models" 
  ON public.models FOR SELECT USING (true);

CREATE POLICY "Allow models to manage their own portfolio" 
  ON public.models FOR ALL USING (auth.uid()::text = "userId");
