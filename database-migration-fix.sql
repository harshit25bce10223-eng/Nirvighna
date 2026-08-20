-- Migration to fix temple ID mismatch
-- This changes temples table from UUID to string IDs to match templeRegistry

-- Step 1: Drop foreign key constraints that reference temples.id
ALTER TABLE darshan_slots DROP CONSTRAINT IF EXISTS darshan_slots_temple_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_temple_id_fkey;
ALTER TABLE lost_found_cases DROP CONSTRAINT IF EXISTS lost_found_cases_temple_id_fkey;
ALTER TABLE footwear_lockers DROP CONSTRAINT IF EXISTS footwear_lockers_temple_id_fkey;
ALTER TABLE ropeway_schedule DROP CONSTRAINT IF EXISTS ropeway_schedule_temple_id_fkey;
ALTER TABLE temple_capacity DROP CONSTRAINT IF EXISTS temple_capacity_temple_id_fkey;
ALTER TABLE cross_temple_routes DROP CONSTRAINT IF EXISTS cross_temple_routes_from_temple_id_fkey;
ALTER TABLE cross_temple_routes DROP CONSTRAINT IF EXISTS cross_temple_routes_to_temple_id_fkey;
ALTER TABLE mela_mode_config DROP CONSTRAINT IF EXISTS mela_mode_config_temple_id_fkey;
ALTER TABLE audio_sensor_data DROP CONSTRAINT IF EXISTS audio_sensor_data_temple_id_fkey;
ALTER TABLE panic_alerts DROP CONSTRAINT IF EXISTS panic_alerts_temple_id_fkey;
ALTER TABLE premises_layout DROP CONSTRAINT IF EXISTS premises_layout_temple_id_fkey;
ALTER TABLE simulation_scenarios DROP CONSTRAINT IF EXISTS simulation_scenarios_temple_id_fkey;
ALTER TABLE crowd_flow_patterns DROP CONSTRAINT IF EXISTS crowd_flow_patterns_temple_id_fkey;
ALTER TABLE prasad_queue_tokens DROP CONSTRAINT IF EXISTS prasad_queue_tokens_temple_id_fkey;
ALTER TABLE bhandara_counters DROP CONSTRAINT IF EXISTS bhandara_counters_temple_id_fkey;
ALTER TABLE queue_status DROP CONSTRAINT IF EXISTS queue_status_temple_id_fkey;
ALTER TABLE parking_sensors DROP CONSTRAINT IF EXISTS parking_sensors_temple_id_fkey;
ALTER TABLE audio_navigation DROP CONSTRAINT IF EXISTS audio_navigation_temple_id_fkey;
ALTER TABLE volunteer_locations DROP CONSTRAINT IF EXISTS volunteer_locations_temple_id_fkey;
ALTER TABLE crowd_history DROP CONSTRAINT IF EXISTS crowd_history_temple_id_fkey;
ALTER TABLE weather_data DROP CONSTRAINT IF EXISTS weather_data_temple_id_fkey;
ALTER TABLE festival_calendar DROP CONSTRAINT IF EXISTS festival_calendar_temple_id_fkey;
ALTER TABLE counters DROP CONSTRAINT IF EXISTS counters_temple_id_fkey;

-- Step 2: Change temple_id column type to TEXT in all referencing tables
ALTER TABLE darshan_slots ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE bookings ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE lost_found_cases ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE footwear_lockers ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE ropeway_schedule ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE temple_capacity ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE cross_temple_routes ALTER COLUMN from_temple_id TYPE TEXT USING from_temple_id::text;
ALTER TABLE cross_temple_routes ALTER COLUMN to_temple_id TYPE TEXT USING to_temple_id::text;
ALTER TABLE mela_mode_config ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE audio_sensor_data ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE panic_alerts ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE premises_layout ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE simulation_scenarios ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE crowd_flow_patterns ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE prasad_queue_tokens ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE bhandara_counters ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE queue_status ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE parking_sensors ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE audio_navigation ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE volunteer_locations ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE crowd_history ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE weather_data ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE festival_calendar ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;
ALTER TABLE counters ALTER COLUMN temple_id TYPE TEXT USING temple_id::text;

-- Step 3: Create a backup of existing temples data (only if temples table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'temples') THEN
    CREATE TABLE IF NOT EXISTS temples_backup AS SELECT * FROM temples;
  END IF;
END $$;

-- Step 4: Drop the existing temples table
DROP TABLE IF EXISTS temples;

-- Step 5: Recreate temples table with string ID
CREATE TABLE temples (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  live_capacity_percentage INTEGER DEFAULT 0 CHECK (live_capacity_percentage >= 0 AND live_capacity_percentage <= 100),
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Insert temples with string IDs matching templeRegistry
INSERT INTO temples (id, name, location, description, image_url, live_capacity_percentage, opening_time, closing_time) VALUES
('tmp_somnath', 'Somnath Temple', 'Prabhas Patan, Gujarat', 'One of the 12 Jyotirlingas, dedicated to Lord Shiva', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Somnath_temple_2016.jpg/800px-Somnath_temple_2016.jpg', 45, '06:00:00', '21:00:00'),
('tmp_dwarka', 'Dwarkadhish Temple', 'Dwarka, Gujarat', 'Dedicated to Lord Krishna, one of the Char Dham pilgrimages', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Dwarkadhish_Temple_Dwarka.jpg/800px-Dwarkadhish_Temple_Dwarka.jpg', 62, '05:30:00', '21:30:00'),
('tmp_ambaji', 'Ambaji Temple', 'Banaskantha, Gujarat', 'One of the 51 Shakti Peethas', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Ambaji_Temple.jpg/800px-Ambaji_Temple.jpg', 38, '06:00:00', '20:00:00'),
('tmp_pavagadh', 'Kalika Mata Temple', 'Champaner, Gujarat', 'Kalika Mata Temple on Pavagadh Hill', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Kalika_Mata_Temple_Pavagadh.jpg/800px-Kalika_Mata_Temple_Pavagadh.jpg', 55, '06:00:00', '19:00:00'),
('tmp_girnar', 'Girnar Temple', 'Junagadh, Gujarat', 'Group of temples on Girnar mountain', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Girnar_Temple_Complex.jpg/800px-Girnar_Temple_Complex.jpg', 42, '06:00:00', '18:00:00');

-- Step 7: Re-enable RLS
ALTER TABLE temples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view temples" ON temples;
CREATE POLICY "Anyone can view temples" ON temples FOR SELECT USING (true);

-- Step 8: Recreate foreign key constraints with TEXT type
ALTER TABLE darshan_slots ADD CONSTRAINT darshan_slots_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE CASCADE;
ALTER TABLE lost_found_cases ADD CONSTRAINT lost_found_cases_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE footwear_lockers ADD CONSTRAINT footwear_lockers_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE ropeway_schedule ADD CONSTRAINT ropeway_schedule_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE temple_capacity ADD CONSTRAINT temple_capacity_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE cross_temple_routes ADD CONSTRAINT cross_temple_routes_from_temple_id_fkey FOREIGN KEY (from_temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE cross_temple_routes ADD CONSTRAINT cross_temple_routes_to_temple_id_fkey FOREIGN KEY (to_temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE mela_mode_config ADD CONSTRAINT mela_mode_config_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE audio_sensor_data ADD CONSTRAINT audio_sensor_data_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE panic_alerts ADD CONSTRAINT panic_alerts_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE premises_layout ADD CONSTRAINT premises_layout_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE simulation_scenarios ADD CONSTRAINT simulation_scenarios_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE crowd_flow_patterns ADD CONSTRAINT crowd_flow_patterns_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE prasad_queue_tokens ADD CONSTRAINT prasad_queue_tokens_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE bhandara_counters ADD CONSTRAINT bhandara_counters_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE queue_status ADD CONSTRAINT queue_status_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE parking_sensors ADD CONSTRAINT parking_sensors_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE audio_navigation ADD CONSTRAINT audio_navigation_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE volunteer_locations ADD CONSTRAINT volunteer_locations_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE crowd_history ADD CONSTRAINT crowd_history_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE weather_data ADD CONSTRAINT weather_data_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE festival_calendar ADD CONSTRAINT festival_calendar_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;
ALTER TABLE counters ADD CONSTRAINT counters_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;

-- Step 9: Update temple_id values to match new string IDs
-- Only do this if we have a backup table (meaning there was existing data to migrate)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'temples_backup') THEN
    -- First, create a mapping table to help with migration
    CREATE TEMP TABLE temple_id_mapping AS 
    SELECT 
      CASE 
        WHEN name LIKE '%Somnath%' THEN 'tmp_somnath'
        WHEN name LIKE '%Dwarka%' THEN 'tmp_dwarka'
        WHEN name LIKE '%Ambaji%' THEN 'tmp_ambaji'
        WHEN name LIKE '%Pavagadh%' THEN 'tmp_pavagadh'
        WHEN name LIKE '%Girnar%' THEN 'tmp_girnar'
        ELSE 'tmp_somnath'
      END as new_id,
      id as old_id
    FROM temples_backup;

    -- Update darshan_slots temple_id
    UPDATE darshan_slots 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    -- Update bookings temple_id
    UPDATE bookings 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    -- Update other tables similarly
    UPDATE lost_found_cases 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE footwear_lockers 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE ropeway_schedule 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE temple_capacity 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE cross_temple_routes 
    SET from_temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = from_temple_id::text)
    WHERE from_temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE cross_temple_routes 
    SET to_temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = to_temple_id::text)
    WHERE to_temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE mela_mode_config 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE audio_sensor_data 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE panic_alerts 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE premises_layout 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE simulation_scenarios 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE crowd_flow_patterns 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE prasad_queue_tokens 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE bhandara_counters 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE queue_status 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE parking_sensors 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE audio_navigation 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE volunteer_locations 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE crowd_history 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE weather_data 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE festival_calendar 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    UPDATE counters 
    SET temple_id = (SELECT new_id FROM temple_id_mapping WHERE old_id::text = temple_id::text)
    WHERE temple_id IN (SELECT old_id::text FROM temple_id_mapping);

    -- Clean up
    DROP TABLE IF EXISTS temple_id_mapping;
    DROP TABLE IF EXISTS temples_backup;
  END IF;
END $$;
