-- Enable RLS on every table
ALTER TABLE public.schedule_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;

-- Public SELECT on all tables
CREATE POLICY "public select schedule_rules" ON public.schedule_rules FOR SELECT USING (true);
CREATE POLICY "public select time_entries"   ON public.time_entries   FOR SELECT USING (true);
CREATE POLICY "public select facilities"     ON public.facilities    FOR SELECT USING (true);
CREATE POLICY "public select profiles"       ON public.profiles      FOR SELECT USING (true);

-- INSERT policies based on role
CREATE POLICY "insert schedule_rules for managers"
  ON public.schedule_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

CREATE POLICY "insert time_entries for cleaners"
  ON public.time_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'cleaner'
    )
  );

-- UPDATE policies based on role
CREATE POLICY "update schedule_rules for managers"
  ON public.schedule_rules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

CREATE POLICY "update time_entries for cleaners"
  ON public.time_entries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'cleaner'
    )
  );

-- DELETE policies based on role
CREATE POLICY "delete schedule_rules for managers"
  ON public.schedule_rules
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

CREATE POLICY "delete time_entries for cleaners"
  ON public.time_entries
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'cleaner'
    )
  ); 