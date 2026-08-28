-- ============================================================================
-- NIRVIGHNA — COMPLETE PRODUCTION DB SETUP (SINGLE FILE)
-- >> IS EK FILE KO RUN KARO (Supabase Dashboard -> SQL Editor -> New query)
-- Ye file sahi order mein hai: PEHLE tables banti hain, PHIR views/policies.
-- Idempotent hai — dobara chalao to bhi safe.
-- ============================================================================

-- ############################################################################
-- PART 1: TABLES (delta for existing live project)
-- ############################################################################

-- 1a. bookings: priority allocations column
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS priority_allocations JSONB DEFAULT '[]'::jsonb;

-- 1b. Medical alerts (emergency email retry engine)
CREATE TABLE IF NOT EXISTS public.medical_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_pass_id UUID REFERENCES public.qr_passes(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  pilgrim_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'en_route', 'reached', 'resolved')),
  responding_volunteer_id UUID REFERENCES public.users(id),
  location TEXT,
  delivery_status TEXT,
  delivery_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1c. Volunteer duty slots & assignments
CREATE TABLE IF NOT EXISTS public.duty_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id TEXT NOT NULL,
  duty_type TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 99,
  claimed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.volunteer_duty_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  duty_type TEXT NOT NULL,
  temple_id TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1d. Padyatri checkpoints & check-ins
CREATE TABLE IF NOT EXISTS public.padyatri_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.padyatri_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilgrim_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  checkpoint_id UUID REFERENCES public.padyatri_checkpoints(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1e. Ropeway bookings
CREATE TABLE IF NOT EXISTS public.ropeway_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT,
  pilgrim_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  temple_id TEXT,
  slot_id TEXT,
  time_window TEXT,
  date DATE,
  direction TEXT DEFAULT 'upward' CHECK (direction IN ('upward', 'downward', 'round_trip')),
  passenger_count INTEGER DEFAULT 1,
  pilgrim_name TEXT,
  pilgrim_phone TEXT,
  qr_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'boarded', 'cancelled')),
  boarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ############################################################################
-- PART 2: ROW LEVEL SECURITY
-- ############################################################################

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.medical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lost_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.darshan_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.volunteer_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.duty_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.volunteer_duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.padyatri_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.padyatri_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ropeway_bookings ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS "Pilgrims can view their own profile" ON public.users;
CREATE POLICY "Pilgrims can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR role = 'admin');

DROP POLICY IF EXISTS "Pilgrims can update their own profile" ON public.users;
CREATE POLICY "Pilgrims can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Bookings (pilgrim_id column references the pilgrim)
DROP POLICY IF EXISTS "Pilgrims can view their own bookings" ON public.bookings;
CREATE POLICY "Pilgrims can view their own bookings"
  ON public.bookings FOR SELECT
  USING (pilgrim_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Pilgrims can insert their own bookings" ON public.bookings;
CREATE POLICY "Pilgrims can insert their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (pilgrim_id = auth.uid());

-- Emergency contacts & group members
DROP POLICY IF EXISTS "Pilgrims can view emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Pilgrims can view emergency contacts"
  ON public.emergency_contacts FOR SELECT
  USING (pilgrim_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Pilgrims can view group members" ON public.group_members;
CREATE POLICY "Pilgrims can view group members"
  ON public.group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = group_members.booking_id AND b.pilgrim_id = auth.uid()
  ) OR auth.jwt() ->> 'role' = 'admin');

-- Notifications: view + INSERT + UPDATE
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_check;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_type_check') THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_type_check
      CHECK (type IN (
        'booking', 'booking_confirmed',
        'gate', 'gate_info',
        'emergency', 'medical_alert',
        'alert', 'update', 'general'
      ));
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Medical alerts
DROP POLICY IF EXISTS "Users can view own medical alerts" ON public.medical_alerts;
CREATE POLICY "Users can view own medical alerts" ON public.medical_alerts FOR SELECT USING (
  auth.uid() = pilgrim_id OR auth.uid() = responding_volunteer_id
  OR auth.uid() IN (SELECT id FROM public.users WHERE role IN ('volunteer', 'admin'))
);
DROP POLICY IF EXISTS "Authenticated can report medical alerts" ON public.medical_alerts;
CREATE POLICY "Authenticated can report medical alerts" ON public.medical_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Responders can update medical alerts" ON public.medical_alerts;
CREATE POLICY "Responders can update medical alerts" ON public.medical_alerts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Duty slots
DROP POLICY IF EXISTS "Volunteers can view duty slots" ON public.duty_slots;
CREATE POLICY "Volunteers can view duty slots" ON public.duty_slots FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Volunteers can claim duty slots" ON public.duty_slots;
CREATE POLICY "Volunteers can claim duty slots" ON public.duty_slots FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Volunteers can create duty slots" ON public.duty_slots;
CREATE POLICY "Volunteers can create duty slots" ON public.duty_slots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Duty assignments
DROP POLICY IF EXISTS "Volunteers can view own assignments" ON public.volunteer_duty_assignments;
CREATE POLICY "Volunteers can view own assignments" ON public.volunteer_duty_assignments FOR SELECT USING (
  auth.uid() = volunteer_id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);
DROP POLICY IF EXISTS "Volunteers can claim assignments" ON public.volunteer_duty_assignments;
CREATE POLICY "Volunteers can claim assignments" ON public.volunteer_duty_assignments FOR INSERT WITH CHECK (auth.uid() = volunteer_id);

-- Padyatri checkpoints / check-ins
DROP POLICY IF EXISTS "Anyone can view checkpoints" ON public.padyatri_checkpoints;
CREATE POLICY "Anyone can view checkpoints" ON public.padyatri_checkpoints FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own check-ins" ON public.padyatri_checkins;
CREATE POLICY "Users can view own check-ins" ON public.padyatri_checkins FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can insert own check-ins" ON public.padyatri_checkins;
CREATE POLICY "Users can insert own check-ins" ON public.padyatri_checkins FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);

-- Ropeway bookings
DROP POLICY IF EXISTS "Users can view own ropeway bookings" ON public.ropeway_bookings;
CREATE POLICY "Users can view own ropeway bookings" ON public.ropeway_bookings FOR SELECT USING (
  auth.uid() = pilgrim_id OR auth.uid() IN (SELECT id FROM public.users WHERE role IN ('volunteer', 'admin'))
);
DROP POLICY IF EXISTS "Users can create ropeway bookings" ON public.ropeway_bookings;
CREATE POLICY "Users can create ropeway bookings" ON public.ropeway_bookings FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Volunteers can scan ropeway bookings" ON public.ropeway_bookings;
CREATE POLICY "Volunteers can scan ropeway bookings" ON public.ropeway_bookings FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role IN ('volunteer', 'admin'))
);

-- ############################################################################
-- PART 3: VOLUNTEER SAFE VIEWS (tables upar ban chuki hain — ab safe hai)
-- ############################################################################

CREATE OR REPLACE VIEW public.volunteer_qr_passes_view AS
SELECT
  qp.id,
  qp.booking_id,
  b.temple_id,
  ds.slot_date,
  ds.start_time,
  ds.end_time,
  ds.slot_type,
  b.status,
  b.is_priority,
  b.gate_number,
  CONCAT(SUBSTRING(qp.pilgrim_name FROM 1 FOR 1), '*** ', SUBSTRING(qp.pilgrim_name FROM POSITION(' ' IN qp.pilgrim_name) + 1 FOR 1), '***') AS pilgrim_masked_name
FROM public.qr_passes qp
JOIN public.bookings b ON qp.booking_id = b.id
LEFT JOIN public.darshan_slots ds ON b.slot_id = ds.id;

CREATE OR REPLACE VIEW public.volunteer_medical_alerts_view AS
SELECT
  ma.id,
  ma.alert_type,
  ma.severity,
  ma.status,
  ma.location,
  ma.created_at,
  ma.responding_volunteer_id
FROM public.medical_alerts ma;

GRANT SELECT ON public.volunteer_qr_passes_view TO authenticated, anon;
GRANT SELECT ON public.volunteer_medical_alerts_view TO authenticated, anon;

-- ############################################################################
-- PART 4: PREVENT ROLE ESCALATION TRIGGER
-- ############################################################################

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('volunteer', 'admin') AND (OLD IS NULL OR OLD.role NOT IN ('volunteer', 'admin')) THEN
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' AND auth.jwt()->>'role' != 'admin' THEN
      NEW.role := 'pilgrim';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- ############################################################################
-- PART 5: ADMIN & VOLUNTEER ROLES PROMOTE KARO (REAL MODE)
-- ----------------------------------------------------------------------------
-- STEP A: Dashboard -> Authentication -> Users -> Add user
--         (auto-confirm ON) — admin account + volunteer accounts banao.
--
-- STEP B: Neeche ke statements UNCOMMENT karo (apne emails daalo) aur dobara
--         ye same file run kar do — ya sirf ye section select karke run karo:
--
-- UPDATE public.users SET role = 'admin'     WHERE email = 'admin@somnath.gov.in';
-- UPDATE public.users SET role = 'volunteer' WHERE email IN (
--   'vikram.vol@nirvighna.org',
--   'anand.vol@nirvighna.org',
--   'savitri.vol@nirvighna.org',
--   'rajesh.vol@nirvighna.org',
--   'pooja.vol@nirvighna.org',
--   'karan.vol@nirvighna.org'
-- );
-- ############################################################################

-- VERIFY: promoted roles dekho
-- SELECT email, role FROM public.users WHERE role IN ('admin', 'volunteer');
