-- ============================================================================
-- NIRVIGHNA MANDIR SAFETY PLATFORM — ROW LEVEL SECURITY (RLS) MIGRATION SCRIPT
-- Enforces Postgres database-level privacy, field-level access control & role policies
-- ============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL DATABASE TABLES
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

-- 2. DROP EXISTING POLICIES TO PREVENT DUPLICATION
DROP POLICY IF EXISTS "Pilgrims can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Pilgrims can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Pilgrims can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Pilgrims can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Pilgrims can view their own QR passes" ON public.qr_passes;
DROP POLICY IF EXISTS "Pilgrims can view emergency contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Pilgrims can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Pilgrims can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;

-- 3. USER PROFILE RLS POLICIES (Pilgrims only see/update their own row)
CREATE POLICY "Pilgrims can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Pilgrims can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 4. BOOKINGS RLS POLICIES
CREATE POLICY "Pilgrims can view their own bookings"
  ON public.bookings FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Pilgrims can insert their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. EMERGENCY CONTACTS & GROUP MEMBERS RLS POLICIES
CREATE POLICY "Pilgrims can view emergency contacts"
  ON public.emergency_contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()
  ) OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Pilgrims can view group members"
  ON public.group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()
  ) OR auth.jwt() ->> 'role' = 'admin');

-- 6. NOTIFICATIONS RLS POLICY (Strict user_id matching)
CREATE POLICY "Pilgrims can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- 7. VOLUNTEER SAFE VIEWS (EXCLUDES SENSITIVE MEDICAL PROFILE, PHONE & EMERGENCY CONTACTS)
-- Volunteers query these Postgres VIEWs instead of the raw tables to prevent privacy leaks

CREATE OR REPLACE VIEW public.volunteer_qr_passes_view AS
SELECT 
  qp.id,
  qp.booking_id,
  qp.temple_id,
  qp.slot_time,
  qp.slot_date,
  qp.pass_type,
  qp.status,
  qp.verification_code,
  b.slot_category,
  b.total_persons,
  -- Masked pilgrim name for scanner display (Privacy-Preserving)
  CONCAT(SUBSTRING(u.full_name FROM 1 FOR 1), '*** ', SUBSTRING(u.full_name FROM POSITION(' ' IN u.full_name) + 1 FOR 1), '***') AS pilgrim_masked_name
FROM public.qr_passes qp
JOIN public.bookings b ON qp.booking_id = b.id
JOIN public.users u ON b.user_id = u.id;

CREATE OR REPLACE VIEW public.volunteer_medical_alerts_view AS
SELECT 
  ma.id,
  ma.temple_id,
  ma.location_zone,
  ma.alert_type,
  ma.status,
  ma.created_at,
  ma.dispatched_volunteer_id,
  -- Sanitized triage notes excluding full private medical profile or phone numbers
  ma.public_triage_notes
FROM public.medical_alerts ma;

-- 8. GRANT VIEW PERMISSIONS TO VOLUNTEER & ANON ROLES
GRANT SELECT ON public.volunteer_qr_passes_view TO authenticated, anon;
GRANT SELECT ON public.volunteer_medical_alerts_view TO authenticated, anon;

-- 9. PREVENT PRIVILEGE ESCALATION TRIGGER (DATABASE-LEVEL ROLE HARDCODING)
-- Standard user signup inserts cannot elevate role to 'volunteer' or 'admin'
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('volunteer', 'admin') AND (OLD IS NULL OR OLD.role NOT IN ('volunteer', 'admin')) THEN
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' AND auth.jwt()->>'role' != 'admin' THEN
      NEW.role := 'pilgrim'; -- Force role back to pilgrim
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
