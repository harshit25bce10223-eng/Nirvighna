-- Nirvighna - Temple Pilgrimage Crowd Management App
-- Complete SQL Schema + Auth Setup + RLS (STEP 1 & STEP 2) for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TEMPLES TABLE
-- ============================================
CREATE TABLE temples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    has_ropeway BOOLEAN DEFAULT FALSE,
    has_boat_crossing BOOLEAN DEFAULT FALSE,
    live_capacity_percentage INTEGER DEFAULT 0 CHECK (live_capacity_percentage >= 0 AND live_capacity_percentage <= 100),
    total_capacity INTEGER DEFAULT 0,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. USERS TABLE (Linked to auth.users)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL DEFAULT 'Pilgrim',
    role VARCHAR(50) NOT NULL DEFAULT 'pilgrim' CHECK (role IN ('pilgrim', 'volunteer', 'admin')),
    language_preference VARCHAR(10) DEFAULT 'en',
    medical_profile JSONB DEFAULT '{}',
    assigned_zone VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. EMERGENCY CONTACTS TABLE
-- ============================================
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pilgrim_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. DARSHAN SLOTS TABLE
-- ============================================
CREATE TABLE darshan_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type VARCHAR(20) NOT NULL CHECK (slot_type IN ('general', 'vip')),
    capacity INTEGER NOT NULL,
    booked_count INTEGER DEFAULT 0 CHECK (booked_count >= 0 AND booked_count <= capacity),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(temple_id, slot_date, start_time, slot_type)
);

-- ============================================
-- 5. BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pilgrim_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES darshan_slots(id) ON DELETE SET NULL,
    booking_mode VARCHAR(20) NOT NULL CHECK (booking_mode IN ('online', 'offline')),
    gate_number INTEGER,
    is_priority BOOLEAN DEFAULT FALSE,
    shared_booking_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled')),
    total_pilgrims INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. GROUP MEMBERS TABLE
-- ============================================
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    medical_notes TEXT,
    shared_login_code VARCHAR(20) UNIQUE,
    is_linked_login BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. QR PASSES TABLE
-- ============================================
CREATE TABLE qr_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    group_member_id UUID REFERENCES group_members(id) ON DELETE CASCADE,
    qr_value VARCHAR(255) UNIQUE NOT NULL,
    pilgrim_name VARCHAR(255) NOT NULL,
    scan_status VARCHAR(30) DEFAULT 'not_scanned' CHECK (scan_status IN ('not_scanned', 'scanned', 'expired', 'voided')),
    scanned_at TIMESTAMP WITH TIME ZONE,
    scanned_by UUID REFERENCES users(id),
    gate_number INTEGER,
    is_valid BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. MEDICAL ALERTS TABLE
-- ============================================
CREATE TABLE medical_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_pass_id UUID NOT NULL REFERENCES qr_passes(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'en_route', 'reached', 'resolved')),
    responding_volunteer_id UUID REFERENCES users(id),
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 9. LOST AND FOUND CASES TABLE
-- ============================================
CREATE TABLE lost_found_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    case_type VARCHAR(20) NOT NULL CHECK (case_type IN ('lost', 'found')),
    description TEXT NOT NULL,
    item_category VARCHAR(100),
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_volunteer_id UUID REFERENCES users(id),
    reported_by UUID REFERENCES users(id),
    location_found VARCHAR(255),
    location_last_seen VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. CROWD DENSITY LOGS TABLE
-- ============================================
CREATE TABLE crowd_density_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    zone VARCHAR(100) NOT NULL,
    density_level VARCHAR(20) NOT NULL CHECK (density_level IN ('low', 'medium', 'high', 'critical')),
    estimated_count INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- ============================================
-- 11. PARKING STATUS TABLE
-- ============================================
CREATE TABLE parking_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    parking_zone VARCHAR(100) NOT NULL,
    total_slots INTEGER NOT NULL,
    available_slots INTEGER NOT NULL CHECK (available_slots >= 0 AND available_slots <= total_slots),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'limited', 'full')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. SHUTTLE TRACKING TABLE
-- ============================================
CREATE TABLE shuttle_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    shuttle_id VARCHAR(50) NOT NULL,
    shuttle_type VARCHAR(50) NOT NULL,
    current_location VARCHAR(255),
    destination VARCHAR(255),
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0 CHECK (current_occupancy >= 0 AND current_occupancy <= capacity),
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'en_route', 'at_stop', 'maintenance', 'inactive')),
    eta_minutes INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. DONATIONS TABLE
-- ============================================
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pilgrim_id UUID REFERENCES users(id) ON DELETE SET NULL,
    temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    donation_type VARCHAR(50) DEFAULT 'general',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('booking', 'alert', 'update', 'emergency', 'general')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: SUPABASE AUTH TRIGGER FOR AUTO-CREATING USER ROW
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, full_name, role, language_preference)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pilgrim'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pilgrim'),
    'en'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run handle_new_user() whenever a user registers in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_temples_location ON temples(location);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_emergency_contacts_pilgrim ON emergency_contacts(pilgrim_id);
CREATE INDEX idx_group_members_booking ON group_members(booking_id);
CREATE INDEX idx_darshan_slots_temple ON darshan_slots(temple_id);
CREATE INDEX idx_bookings_pilgrim ON bookings(pilgrim_id);
CREATE INDEX idx_qr_passes_booking ON qr_passes(booking_id);
CREATE INDEX idx_medical_alerts_qr_pass ON medical_alerts(qr_pass_id);
CREATE INDEX idx_lost_found_booking ON lost_found_cases(booking_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_temples_updated_at BEFORE UPDATE ON temples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA FOR 4 TEMPLES
-- ============================================
INSERT INTO temples (name, location, address, has_ropeway, has_boat_crossing, live_capacity_percentage, total_capacity, description) VALUES
(
    'Somnath Temple',
    'Somnath, Gujarat',
    'Prabhas Patan, Near Veraval, Gujarat 362268',
    FALSE,
    FALSE,
    45,
    50000,
    'One of the 12 Jyotirlinga shrines of Shiva, located on the western coast of Gujarat.'
),
(
    'Dwarkadhish Temple',
    'Dwarka, Gujarat',
    'Dwarka, Gujarat 361335',
    FALSE,
    TRUE,
    60,
    30000,
    'Dedicated to Lord Krishna. Requires boat crossing to reach the island temple.'
),
(
    'Ambaji Temple',
    'Ambaji, Gujarat',
    'Banaskantha district, Gujarat 385110',
    FALSE,
    FALSE,
    35,
    25000,
    'One of the 51 Shakti Peethas, dedicated to Goddess Ambaji.'
),
(
    'Kalika Mata Temple',
    'Pavagadh, Gujarat',
    'Pavagadh Hill, Champaner, Gujarat 389360',
    TRUE,
    FALSE,
    55,
    20000,
    'Located atop Pavagadh Hill, accessible via ropeway. Dedicated to Goddess Kali.'
);

-- ============================================
-- STEP 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE temples ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE darshan_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowd_density_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE shuttle_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. TEMPLES: Viewable by everyone
CREATE POLICY "Temples are viewable by everyone" ON temples FOR SELECT USING (true);

-- 2. USERS: Pilgrims can only read/update their own user row. Admins can read all.
CREATE POLICY "Users can read own row" ON users FOR SELECT USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own row" ON users FOR UPDATE USING (auth.uid() = id);

-- 3. EMERGENCY CONTACTS: Pilgrims can read/update their own contacts. Admins & Volunteers can read.
CREATE POLICY "Emergency contacts viewable by owner or staff" ON emergency_contacts FOR SELECT USING (
    pilgrim_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
);
CREATE POLICY "Pilgrims can insert own emergency contacts" ON emergency_contacts FOR INSERT WITH CHECK (pilgrim_id = auth.uid());

-- 4. BOOKINGS: Pilgrims can read/update own bookings. Admins & Volunteers can read all.
CREATE POLICY "Bookings viewable by owner or staff" ON bookings FOR SELECT USING (
    pilgrim_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
);
CREATE POLICY "Pilgrims can create bookings" ON bookings FOR INSERT WITH CHECK (pilgrim_id = auth.uid());

-- 5. GROUP MEMBERS: Pilgrims can read/manage group members under their booking.
CREATE POLICY "Group members viewable by booking owner or staff" ON group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = group_members.booking_id AND b.pilgrim_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
);

-- 6. QR PASSES: Volunteers & Admins can read qr_passes (without exposing full medical profile). Pilgrims can read own passes.
CREATE POLICY "QR passes viewable by holder or staff" ON qr_passes FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = qr_passes.booking_id AND b.pilgrim_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
);

-- 7. MEDICAL ALERTS: Volunteers and Admins can view/update medical alerts.
CREATE POLICY "Medical alerts viewable by staff" ON medical_alerts FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
);
CREATE POLICY "Staff can update medical alert status" ON medical_alerts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'volunteer'))
);

-- 8. PUBLIC READ DATA (Crowd, Parking, Shuttles, Slots)
CREATE POLICY "Darshan slots viewable by everyone" ON darshan_slots FOR SELECT USING (true);
CREATE POLICY "Crowd density viewable by everyone" ON crowd_density_logs FOR SELECT USING (true);
CREATE POLICY "Parking status viewable by everyone" ON parking_status FOR SELECT USING (true);
CREATE POLICY "Shuttle tracking viewable by everyone" ON shuttle_tracking FOR SELECT USING (true);
