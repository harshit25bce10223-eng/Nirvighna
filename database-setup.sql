-- Nirvighna Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  profile_photo TEXT,
  aadhar_number TEXT,
  blood_group TEXT,
  medical_details TEXT,
  role TEXT DEFAULT 'pilgrim' CHECK (role IN ('pilgrim', 'admin', 'volunteer')),
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'hi', 'gu')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'aadhar_number'
  ) THEN
    ALTER TABLE users ADD COLUMN aadhar_number TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'blood_group'
  ) THEN
    ALTER TABLE users ADD COLUMN blood_group TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'medical_details'
  ) THEN
    ALTER TABLE users ADD COLUMN medical_details TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Temples table
CREATE TABLE IF NOT EXISTS temples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  live_capacity_percentage INTEGER DEFAULT 0 CHECK (live_capacity_percentage >= 0 AND live_capacity_percentage <= 100),
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for temples
ALTER TABLE temples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view temples" ON temples;
CREATE POLICY "Anyone can view temples" ON temples FOR SELECT USING (true);

-- Darshan Slots table
CREATE TABLE IF NOT EXISTS darshan_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type TEXT DEFAULT 'general' CHECK (slot_type IN ('general', 'vip')),
  capacity INTEGER NOT NULL DEFAULT 100,
  booked_count INTEGER DEFAULT 0 CHECK (booked_count >= 0 AND booked_count <= capacity),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for darshan_slots
ALTER TABLE darshan_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view slots" ON darshan_slots;
CREATE POLICY "Anyone can view slots" ON darshan_slots FOR SELECT USING (true);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilgrim_id UUID REFERENCES users(id) ON DELETE CASCADE,
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES darshan_slots(id) ON DELETE CASCADE,
  booking_mode TEXT DEFAULT 'online' CHECK (booking_mode IN ('online', 'offline')),
  gate_number INTEGER,
  is_priority BOOLEAN DEFAULT false,
  shared_booking_code TEXT UNIQUE,
  pilgrim_phone TEXT,
  total_pilgrims INTEGER DEFAULT 1,
  priority_allocations JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add priority_allocations to pre-existing bookings tables
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS priority_allocations JSONB DEFAULT '[]'::jsonb;

-- RLS Policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = pilgrim_id);

-- QR Passes table
CREATE TABLE IF NOT EXISTS qr_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  qr_value TEXT UNIQUE NOT NULL,
  pilgrim_name TEXT NOT NULL,
  pilgrim_phone TEXT,
  scan_status TEXT DEFAULT 'not_scanned' CHECK (scan_status IN ('not_scanned', 'scanned', 'expired')),
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for qr_passes
ALTER TABLE qr_passes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own QR passes" ON qr_passes;
CREATE POLICY "Users can view own QR passes" ON qr_passes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = qr_passes.booking_id 
    AND bookings.pilgrim_id = auth.uid()
  )
);

-- Group Members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  age INTEGER,
  phone TEXT,
  email TEXT,
  aadhar_number TEXT,
  blood_group TEXT,
  medical_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own group members" ON group_members;
CREATE POLICY "Users can view own group members" ON group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = group_members.booking_id 
    AND bookings.pilgrim_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can create group members" ON group_members;
CREATE POLICY "Users can create group members" ON group_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = group_members.booking_id 
    AND bookings.pilgrim_id = auth.uid()
  )
);

-- Emergency Contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilgrim_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for emergency_contacts
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users can view own emergency contacts" ON emergency_contacts FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can create emergency contacts" ON emergency_contacts;
CREATE POLICY "Users can create emergency contacts" ON emergency_contacts FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can update own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users can update own emergency contacts" ON emergency_contacts FOR UPDATE USING (auth.uid() = pilgrim_id);

-- Lost & Found Cases table
CREATE TABLE IF NOT EXISTS lost_found_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilgrim_id UUID REFERENCES users(id) ON DELETE CASCADE,
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  missing_person_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  description TEXT,
  last_seen_location TEXT,
  last_seen_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'found', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for lost_found_cases
ALTER TABLE lost_found_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own cases" ON lost_found_cases;
CREATE POLICY "Users can view own cases" ON lost_found_cases FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can create cases" ON lost_found_cases;
CREATE POLICY "Users can create cases" ON lost_found_cases FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can update own cases" ON lost_found_cases;
CREATE POLICY "Users can update own cases" ON lost_found_cases FOR UPDATE USING (auth.uid() = pilgrim_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking', 'booking_confirmed', 'gate', 'gate_info', 'emergency', 'medical_alert', 'alert', 'update', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate the CHECK constraint on pre-existing notifications tables
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_check;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_type_check'
  ) THEN
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('booking', 'booking_confirmed', 'gate', 'gate_info', 'emergency', 'medical_alert', 'alert', 'update', 'general'));
  END IF;
END $$;

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Medical Assistance Cases table
CREATE TABLE IF NOT EXISTS medical_assistance_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  pilgrim_id UUID REFERENCES users(id) ON DELETE SET NULL,
  volunteer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location TEXT,
  assistance_type TEXT CHECK (assistance_type IN ('medical', 'priority', 'emergency')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'en_route', 'reached', 'resolved', 'cancelled')),
  medical_notes TEXT,
  blood_group TEXT,
  allergies TEXT,
  conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for medical_assistance_cases
ALTER TABLE medical_assistance_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own medical cases" ON medical_assistance_cases;
CREATE POLICY "Users can view own medical cases" ON medical_assistance_cases FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Volunteers can view assigned cases" ON medical_assistance_cases;
CREATE POLICY "Volunteers can view assigned cases" ON medical_assistance_cases FOR SELECT USING (auth.uid() = volunteer_id);
DROP POLICY IF EXISTS "Volunteers can update cases" ON medical_assistance_cases;
CREATE POLICY "Volunteers can update cases" ON medical_assistance_cases FOR UPDATE USING (auth.uid() = volunteer_id OR auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can create medical cases" ON medical_assistance_cases;
CREATE POLICY "Users can create medical cases" ON medical_assistance_cases FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);

-- Priority Assistance Requests table
CREATE TABLE IF NOT EXISTS priority_assistance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  pilgrim_id UUID REFERENCES users(id) ON DELETE SET NULL,
  volunteer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assistance_type TEXT CHECK (assistance_type IN ('wheelchair', 'escort', 'priority_entry')),
  location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'en_route', 'reached', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for priority_assistance
ALTER TABLE priority_assistance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own priority requests" ON priority_assistance;
CREATE POLICY "Users can view own priority requests" ON priority_assistance FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Volunteers can view priority requests" ON priority_assistance;
CREATE POLICY "Volunteers can view priority requests" ON priority_assistance FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);
DROP POLICY IF EXISTS "Volunteers can update priority requests" ON priority_assistance;
CREATE POLICY "Volunteers can update priority requests" ON priority_assistance FOR UPDATE USING (auth.uid() = volunteer_id OR auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can create priority requests" ON priority_assistance;
CREATE POLICY "Users can create priority requests" ON priority_assistance FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);

-- Footwear Lockers table
CREATE TABLE IF NOT EXISTS footwear_lockers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locker_number TEXT UNIQUE NOT NULL,
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  current_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  managed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Footwear Transactions table
CREATE TABLE IF NOT EXISTS footwear_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locker_id UUID REFERENCES footwear_lockers(id) ON DELETE SET NULL,
  pilgrim_id UUID REFERENCES users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  token_number TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('deposit', 'withdraw')),
  footwear_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for footwear_lockers
ALTER TABLE footwear_lockers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Volunteers can view lockers" ON footwear_lockers;
CREATE POLICY "Volunteers can view lockers" ON footwear_lockers FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);
DROP POLICY IF EXISTS "Volunteers can manage lockers" ON footwear_lockers;
CREATE POLICY "Volunteers can manage lockers" ON footwear_lockers FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);

-- RLS Policies for footwear_transactions
ALTER TABLE footwear_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON footwear_transactions;
CREATE POLICY "Users can view own transactions" ON footwear_transactions FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Volunteers can view all transactions" ON footwear_transactions;
CREATE POLICY "Volunteers can view all transactions" ON footwear_transactions FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);
DROP POLICY IF EXISTS "Volunteers can update transactions" ON footwear_transactions;
CREATE POLICY "Volunteers can update transactions" ON footwear_transactions FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);

-- Volunteer Locations table (for real-time tracking)
CREATE TABLE IF NOT EXISTS volunteer_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(10, 2),
  is_medical_trained BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  current_status TEXT DEFAULT 'idle' CHECK (current_status IN ('idle', 'responding', 'assisting', 'break')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for volunteer_locations
ALTER TABLE volunteer_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Volunteers can view own location" ON volunteer_locations;
CREATE POLICY "Volunteers can view own location" ON volunteer_locations FOR SELECT USING (auth.uid() = volunteer_id);
DROP POLICY IF EXISTS "Volunteers can update own location" ON volunteer_locations;
CREATE POLICY "Volunteers can update own location" ON volunteer_locations FOR UPDATE USING (auth.uid() = volunteer_id);
DROP POLICY IF EXISTS "Admin can view all locations" ON volunteer_locations;
CREATE POLICY "Admin can view all locations" ON volunteer_locations FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- AI Crowd Prediction tables
CREATE TABLE IF NOT EXISTS crowd_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  expected_count INTEGER,
  actual_count INTEGER,
  weather_condition TEXT,
  is_festival BOOLEAN DEFAULT false,
  festival_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  temperature DECIMAL(5, 2),
  humidity INTEGER,
  precipitation DECIMAL(5, 2),
  wind_speed DECIMAL(5, 2),
  condition TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS festival_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  festival_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  expected_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-Temple Circuit AI tables
CREATE TABLE IF NOT EXISTS temple_capacity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  current_count INTEGER DEFAULT 0,
  max_capacity INTEGER NOT NULL,
  density_level TEXT CHECK (density_level IN ('low', 'medium', 'high', 'critical')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cross_temple_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  to_temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  distance_km DECIMAL(5, 2),
  estimated_time_minutes INTEGER,
  transport_type TEXT CHECK (transport_type IN ('road', 'rail', 'boat', 'ropeway')),
  is_active BOOLEAN DEFAULT true
);

-- Pavagadh Ropeway Sync tables
CREATE TABLE IF NOT EXISTS ropeway_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity_per_hour INTEGER,
  is_operational BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ropeway_capacity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES ropeway_schedule(id) ON DELETE CASCADE,
  time_slot TIME NOT NULL,
  available_slots INTEGER,
  total_capacity INTEGER,
  queue_length INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bet Dwarka Boat Slot tables
CREATE TABLE IF NOT EXISTS tide_timings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  high_tide_time TIME,
  low_tide_time TIME,
  tide_height DECIMAL(5, 2),
  is_safe_for_boating BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ferry_capacity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  available_slots INTEGER,
  total_capacity INTEGER,
  ferry_id TEXT,
  is_operational BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mela Mode tables
CREATE TABLE IF NOT EXISTS mela_mode_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  festival_id UUID REFERENCES festival_calendar(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT false,
  auto_activate BOOLEAN DEFAULT true,
  crowd_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  special_measures TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Acoustic Panic Detection tables
CREATE TABLE IF NOT EXISTS audio_sensor_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  sensor_id TEXT NOT NULL,
  location TEXT,
  decibel_level DECIMAL(5, 2),
  frequency_range TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_anomaly BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS panic_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_data_id UUID REFERENCES audio_sensor_data(id) ON DELETE SET NULL,
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  location TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'false_alarm')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  volunteer_dispatched BOOLEAN DEFAULT false
);

-- Digital Twin Simulation tables
CREATE TABLE IF NOT EXISTS premises_layout (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  layout_name TEXT NOT NULL,
  layout_data JSONB,
  capacity_zones JSONB,
  emergency_exits JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  scenario_name TEXT NOT NULL,
  expected_footfall INTEGER,
  date DATE,
  duration_hours INTEGER,
  crowd_flow_pattern JSONB,
  bottleneck_predictions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crowd_flow_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  time_of_day TIME,
  day_type TEXT CHECK (day_type IN ('weekday', 'weekend', 'festival')),
  flow_data JSONB,
  hotspots JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prasad/Bhandara Queue tables
CREATE TABLE IF NOT EXISTS prasad_queue_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilgrim_id UUID REFERENCES users(id) ON DELETE SET NULL,
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  token_number TEXT UNIQUE NOT NULL,
  queue_type TEXT CHECK (queue_type IN ('prasad', 'bhandara')),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_wait_minutes INTEGER,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'served', 'cancelled', 'expired')),
  served_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS bhandara_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  counter_number TEXT NOT NULL,
  counter_type TEXT CHECK (counter_type IN ('prasad', 'bhandara')),
  is_active BOOLEAN DEFAULT true,
  current_serving_token TEXT,
  managed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queue_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  queue_type TEXT CHECK (queue_type IN ('prasad', 'bhandara')),
  total_waiting INTEGER DEFAULT 0,
  average_wait_minutes INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Parking & Shuttle tables
CREATE TABLE IF NOT EXISTS parking_sensors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  zone_id TEXT NOT NULL,
  sensor_id TEXT NOT NULL,
  is_occupied BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shuttle_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shuttle_id TEXT NOT NULL,
  route_id TEXT,
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  destination TEXT,
  capacity INTEGER,
  current_occupancy INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('idle', 'en_route', 'loading', 'unloading', 'maintenance')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shuttle_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_name TEXT NOT NULL,
  route_stops JSONB,
  total_distance_km DECIMAL(5, 2),
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Audio Navigation table
CREATE TABLE IF NOT EXISTS audio_navigation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority_assistance_id UUID REFERENCES priority_assistance(id) ON DELETE CASCADE,
  pilgrim_id UUID REFERENCES users(id) ON DELETE SET NULL,
  temple_id UUID REFERENCES temples(id) ON DELETE SET NULL,
  current_location TEXT,
  destination TEXT,
  navigation_path JSONB,
  audio_file_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add email column to emergency_contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'emergency_contacts' AND column_name = 'email'
  ) THEN
    ALTER TABLE emergency_contacts ADD COLUMN email TEXT;
  END IF;
END $$;

-- Add email column to group_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_members' AND column_name = 'email'
  ) THEN
    ALTER TABLE group_members ADD COLUMN email TEXT;
  END IF;
END $$;

-- Counters table for offline booking
CREATE TABLE IF NOT EXISTS counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id UUID REFERENCES temples(id) ON DELETE CASCADE,
  counter_number INTEGER NOT NULL,
  location TEXT,
  operator_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline bookings table
CREATE TABLE IF NOT EXISTS offline_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
  pilgrim_name TEXT NOT NULL,
  pilgrim_phone TEXT,
  pilgrim_aadhar TEXT,
  number_of_pilgrims INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  payment_method TEXT,
  payment_amount DECIMAL(10, 2),
  receipt_number TEXT UNIQUE,
  processed_by TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  cancellation_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for new tables
ALTER TABLE crowd_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can view crowd history" ON crowd_history;
CREATE POLICY "Admin can view crowd history" ON crowd_history FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can view weather data" ON weather_data;
CREATE POLICY "Admin can view weather data" ON weather_data FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

ALTER TABLE festival_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view festival calendar" ON festival_calendar;
CREATE POLICY "Public can view festival calendar" ON festival_calendar FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage festival calendar" ON festival_calendar;
CREATE POLICY "Admin can manage festival calendar" ON festival_calendar FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

ALTER TABLE temple_capacity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view temple capacity" ON temple_capacity;
CREATE POLICY "Public can view temple capacity" ON temple_capacity FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can update temple capacity" ON temple_capacity;
CREATE POLICY "Admin can update temple capacity" ON temple_capacity FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

ALTER TABLE panic_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can view panic alerts" ON panic_alerts;
CREATE POLICY "Admin can view panic alerts" ON panic_alerts FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
DROP POLICY IF EXISTS "Admin can update panic alerts" ON panic_alerts;
CREATE POLICY "Admin can update panic alerts" ON panic_alerts FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

ALTER TABLE prasad_queue_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tokens" ON prasad_queue_tokens;
CREATE POLICY "Users can view own tokens" ON prasad_queue_tokens FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can create tokens" ON prasad_queue_tokens;
CREATE POLICY "Users can create tokens" ON prasad_queue_tokens FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Volunteers can view all tokens" ON prasad_queue_tokens;
CREATE POLICY "Volunteers can view all tokens" ON prasad_queue_tokens FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);

ALTER TABLE audio_navigation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own navigation" ON audio_navigation;
CREATE POLICY "Users can view own navigation" ON audio_navigation FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Volunteers can view navigation" ON audio_navigation;
CREATE POLICY "Volunteers can view navigation" ON audio_navigation FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);

-- Email logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can view email logs" ON email_logs;
CREATE POLICY "Admin can view email logs" ON email_logs FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, language_preference)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'pilgrim',
    'en'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample temples with images
INSERT INTO temples (name, location, description, image_url, live_capacity_percentage, opening_time, closing_time) VALUES
('Somnath Temple', 'Prabhas Patan, Gujarat', 'One of the 12 Jyotirlingas, dedicated to Lord Shiva', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Somnath_temple_2016.jpg/800px-Somnath_temple_2016.jpg', 45, '06:00:00', '21:00:00'),
('Dwarkadhish Temple', 'Dwarka, Gujarat', 'Dedicated to Lord Krishna, one of the Char Dham pilgrimages', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Dwarkadhish_Temple_Dwarka.jpg/800px-Dwarkadhish_Temple_Dwarka.jpg', 62, '05:30:00', '21:30:00'),
('Ambaji Temple', 'Banaskantha, Gujarat', 'One of the 51 Shakti Peethas', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Ambaji_Temple.jpg/800px-Ambaji_Temple.jpg', 38, '06:00:00', '20:00:00'),
('Pavagadh Temple', 'Champaner, Gujarat', 'Kalika Mata Temple on Pavagadh Hill', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Kalika_Mata_Temple_Pavagadh.jpg/800px-Kalika_Mata_Temple_Pavagadh.jpg', 55, '06:00:00', '19:00:00'),
('Girnar Temple', 'Junagadh, Gujarat', 'Group of temples on Girnar mountain', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Girnar_Temple_Complex.jpg/800px-Girnar_Temple_Complex.jpg', 42, '06:00:00', '18:00:00')
ON CONFLICT DO NOTHING;

-- ============================================
-- MEDICAL ALERTS (used by emergency email retry engine)
-- ============================================
CREATE TABLE IF NOT EXISTS medical_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_pass_id UUID REFERENCES qr_passes(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  pilgrim_id UUID REFERENCES users(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'en_route', 'reached', 'resolved')),
  responding_volunteer_id UUID REFERENCES users(id),
  location TEXT,
  delivery_status TEXT,
  delivery_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE medical_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own medical alerts" ON medical_alerts;
CREATE POLICY "Users can view own medical alerts" ON medical_alerts FOR SELECT USING (
  auth.uid() = pilgrim_id OR auth.uid() = responding_volunteer_id
  OR auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);
DROP POLICY IF EXISTS "Authenticated can report medical alerts" ON medical_alerts;
CREATE POLICY "Authenticated can report medical alerts" ON medical_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Responders can update medical alerts" ON medical_alerts;
CREATE POLICY "Responders can update medical alerts" ON medical_alerts FOR UPDATE USING (
  auth.uid() IS NOT NULL
);

-- ============================================
-- VOLUNTEER DUTY SLOTS & ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS duty_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id TEXT NOT NULL,
  duty_type TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 99,
  claimed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE duty_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Volunteers can view duty slots" ON duty_slots;
CREATE POLICY "Volunteers can view duty slots" ON duty_slots FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Volunteers can claim duty slots" ON duty_slots;
CREATE POLICY "Volunteers can claim duty slots" ON duty_slots FOR UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Volunteers can create duty slots" ON duty_slots;
CREATE POLICY "Volunteers can create duty slots" ON duty_slots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS volunteer_duty_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duty_type TEXT NOT NULL,
  temple_id TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE volunteer_duty_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Volunteers can view own assignments" ON volunteer_duty_assignments;
CREATE POLICY "Volunteers can view own assignments" ON volunteer_duty_assignments FOR SELECT USING (
  auth.uid() = volunteer_id OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
DROP POLICY IF EXISTS "Volunteers can claim assignments" ON volunteer_duty_assignments;
CREATE POLICY "Volunteers can claim assignments" ON volunteer_duty_assignments FOR INSERT WITH CHECK (auth.uid() = volunteer_id);

-- ============================================
-- PADYATRI (FOOT MARCH) CHECKPOINTS & CHECK-INS
-- ============================================
CREATE TABLE IF NOT EXISTS padyatri_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temple_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE padyatri_checkpoints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view checkpoints" ON padyatri_checkpoints;
CREATE POLICY "Anyone can view checkpoints" ON padyatri_checkpoints FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS padyatri_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilgrim_id UUID REFERENCES users(id) ON DELETE CASCADE,
  checkpoint_id UUID REFERENCES padyatri_checkpoints(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE padyatri_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own check-ins" ON padyatri_checkins;
CREATE POLICY "Users can view own check-ins" ON padyatri_checkins FOR SELECT USING (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Users can insert own check-ins" ON padyatri_checkins;
CREATE POLICY "Users can insert own check-ins" ON padyatri_checkins FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);

-- ============================================
-- ROPEWAY BOOKINGS
-- ============================================
CREATE TABLE IF NOT EXISTS ropeway_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT,
  pilgrim_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

ALTER TABLE ropeway_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ropeway bookings" ON ropeway_bookings;
CREATE POLICY "Users can view own ropeway bookings" ON ropeway_bookings FOR SELECT USING (
  auth.uid() = pilgrim_id OR auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);
DROP POLICY IF EXISTS "Users can create ropeway bookings" ON ropeway_bookings;
CREATE POLICY "Users can create ropeway bookings" ON ropeway_bookings FOR INSERT WITH CHECK (auth.uid() = pilgrim_id);
DROP POLICY IF EXISTS "Volunteers can scan ropeway bookings" ON ropeway_bookings;
CREATE POLICY "Volunteers can scan ropeway bookings" ON ropeway_bookings FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('volunteer', 'admin'))
);
