# Nirvighna Feature Mapping Document

## Overview
This document maps all unique features to their implementation locations and trigger/feed mechanisms.

---

## Feature Mapping Table

| Feature | Location | Trigger/Feed | Status |
|---------|----------|--------------|--------|
| **AI Crowd Prediction** | Command Centre (engine) → Pilgrim Portal (display) | Historical data + weather + calendar | Pending |
| **Cross-Temple Circuit AI** | Pilgrim Portal (live capacity data) | 4 temples live capacity feed | Pending |
| **Pavagadh Ropeway Sync** | Pilgrim Portal (Pavagadh booking screen only) | Ropeway operator schedule/capacity feed | Pending |
| **Bet Dwarka Boat Slot** | Pilgrim Portal (Dwarka booking screen only) | Tide timing data + ferry capacity | Pending |
| **Mela Mode (Ambaji)** | Pilgrim Portal (auto-activate) | Festival calendar date trigger | Pending |
| **Acoustic Panic Detection** | Command Centre (audio sensors) | Premises audio sensors feed | Pending |
| **Digital Twin Simulation** | Command Centre (pre-event planning) | Expected footfall + premises layout | Pending |
| **Prasad/Bhandara Queue** | Pilgrim Portal (token) + Volunteer Hub (counter scan) | Virtual queue system | Pending |
| **Smart Parking & Shuttle** | Pilgrim Portal (view) + Command Centre (traffic feed) | Parking sensors + shuttle GPS | Pending |
| **Priority Darshan + Audio Nav** | Pilgrim Portal (request) → Volunteer Hub (assist) | Pilgrim declares at booking time | Partially Implemented |
| **Family Reunification** | Pilgrim Portal (report) → Volunteer Hub (search) → Command Centre (oversight) | Lost report trigger | Partially Implemented |
| **Smart Footwear Locker** | Pilgrim Portal (token) + Volunteer Hub (counter) | QR token scan in/out | Implemented |
| **Group Members + Emergency Contact** | Sign-up (Pilgrim Portal) → Volunteer Hub (medical alert cascade) | QR scan + 'Medical Assist' tap | Implemented |
| **Offline Booking** | Physical counter → same backend | Counter staff manual entry | Pending |

---

## Detailed Feature Breakdown

### 1. AI Crowd Prediction
**Where it runs:**
- Engine: Command Centre
- Display: Pilgrim Portal Home Dashboard

**What triggers/feeds it:**
- Historical crowd data (past years)
- Weather API integration
- Calendar events (festivals, holidays)
- Time of day patterns

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `crowd_history` table
- `weather_data` table
- `festival_calendar` table

---

### 2. Cross-Temple Circuit AI
**Where it runs:**
- Pilgrim Portal Home Dashboard

**What triggers/feeds it:**
- Live capacity data from all 4 temples:
  - Somnath
  - Dwarka
  - Ambaji
  - Pavagadh

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `temple_capacity` table with real-time updates
- `cross_temple_routes` table

---

### 3. Pavagadh Ropeway Sync
**Where it runs:**
- Pilgrim Portal Booking Screen (Pavagadh only)

**What triggers/feeds it:**
- Ropeway operator API feed
- Schedule data
- Capacity availability
- Real-time queue status

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `ropeway_schedule` table
- `ropeway_capacity` table
- External API integration

---

### 4. Bet Dwarka Boat Slot
**Where it runs:**
- Pilgrim Portal Booking Screen (Dwarka only)

**What triggers/feeds it:**
- Tide timing API
- Ferry capacity data
- Weather conditions
- Boat schedule

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `tide_timings` table
- `ferry_capacity` table
- External tide API integration

---

### 5. Mela Mode (Ambaji)
**Where it runs:**
- Pilgrim Portal (auto-activation)
- Command Centre (monitoring)

**What triggers/feeds it:**
- Festival calendar dates
- Auto-activation on specific dates
- Manual override capability

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `festival_calendar` table
- `mela_mode_config` table

---

### 6. Acoustic Panic Detection
**Where it runs:**
- Command Centre (real-time monitoring)

**What triggers/feeds it:**
- Audio sensors installed at premises
- Sound pattern analysis
- Panic detection algorithm

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `audio_sensor_data` table
- `panic_alerts` table
- External sensor integration

---

### 7. Digital Twin Simulation
**Where it runs:**
- Command Centre (pre-event planning tool)

**What triggers/feeds it:**
- Expected footfall predictions
- Temple premises layout data
- Historical crowd flow patterns

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `premises_layout` table
- `simulation_scenarios` table
- `crowd_flow_patterns` table

---

### 8. Prasad/Bhandara Queue
**Where it runs:**
- Pilgrim Portal (token generation)
- Volunteer Hub (counter scanning)

**What triggers/feeds it:**
- Virtual queue system
- Token generation on request
- Counter scan for redemption

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `prasad_queue_tokens` table
- `bhandara_counters` table
- `queue_status` table

---

### 9. Smart Parking & Shuttle
**Where it runs:**
- Pilgrim Portal (parking availability view)
- Command Centre (traffic feed)

**What triggers/feeds it:**
- Parking sensor data
- Shuttle GPS tracking
- Real-time availability

**Implementation Status:** ❌ Pending

**Database Requirements:**
- `parking_sensors` table
- `shuttle_locations` table
- `shuttle_routes` table

---

### 10. Priority Darshan + Audio Nav
**Where it runs:**
- Pilgrim Portal (request during booking)
- Volunteer Hub (assistance dispatch)

**What triggers/feeds it:**
- Pilgrim self-declaration during booking
- Priority checkbox in Booking screen
- Volunteer Hub Priority Assist action

**Implementation Status:** ✅ Partially Implemented
- Priority checkbox exists in Booking screen
- Priority Assist action exists in Volunteer Hub
- Missing: Audio navigation integration

**Database Requirements:**
- `priority_assistance` table ✅ Created
- `audio_navigation` table (pending)

---

### 11. Family Reunification
**Where it runs:**
- Pilgrim Portal (lost report)
- Volunteer Hub (search initiation)
- Command Centre (oversight)

**What triggers/feeds it:**
- Lost report from Pilgrim Portal
- Volunteer search initiation
- Command Centre monitoring

**Implementation Status:** ✅ Partially Implemented
- Lost report exists in Pilgrim Portal
- Lost Person action exists in Volunteer Hub
- Missing: Command Centre oversight dashboard

**Database Requirements:**
- `lost_found_cases` table ✅ Created
- Command Centre dashboard (pending)

---

### 12. Smart Footwear Locker
**Where it runs:**
- Pilgrim Portal (token generation)
- Volunteer Hub (counter management)

**What triggers/feeds it:**
- QR token scan for deposit
- QR token scan for withdrawal
- Locker capacity tracking

**Implementation Status:** ✅ Implemented
- Footwear lockers table created
- Footwear transactions table created
- Volunteer Hub has locker management UI
- Token scanning implemented

**Database Requirements:**
- `footwear_lockers` table ✅ Created
- `footwear_transactions` table ✅ Created

---

### 13. Group Members + Emergency Contact
**Where it runs:**
- Sign-up (Pilgrim Portal)
- Volunteer Hub (medical alert cascade)

**What triggers/feeds it:**
- Group member addition during booking
- Emergency contact registration
- QR scan + Medical Assist tap in Volunteer Hub

**Implementation Status:** ✅ Implemented
- Group members in Booking screen ✅
- Emergency contacts in database ✅
- Medical Assist workflow ✅
- Alert cascade to group members ✅
- Emergency contact notification ✅

**Database Requirements:**
- `group_members` table ✅ Created
- `emergency_contacts` table ✅ Created
- `medical_assistance_cases` table ✅ Created

---

### 14. Offline Booking
**Where it runs:**
- Physical counter
- Same backend as online booking

**What triggers/feeds it:**
- Counter staff manual entry
- Backend API integration
- Same validation as online

**Implementation Status:** ❌ Pending

**Database Requirements:**
- Counter staff authentication
- Manual booking API endpoint
- Offline sync mechanism

---

## Implementation Priority

### High Priority (Core Features)
1. ✅ Smart Footwear Locker
2. ✅ Group Members + Emergency Contact
3. ✅ Family Reunification (partial)
4. ✅ Priority Darshan (partial)
5. ❌ AI Crowd Prediction
6. ❌ Cross-Temple Circuit AI
7. ❌ Prasad/Bhandara Queue
8. ❌ Smart Parking & Shuttle

### Medium Priority (Enhancement Features)
9. ❌ Pavagadh Ropeway Sync
10. ❌ Bet Dwarka Boat Slot
11. ❌ Mela Mode (Ambaji)
12. ❌ Digital Twin Simulation

### Low Priority (Advanced Features)
13. ❌ Acoustic Panic Detection
14. ❌ Offline Booking

---

## Database Schema Requirements Summary

### Already Created ✅
- `medical_assistance_cases`
- `priority_assistance`
- `footwear_lockers`
- `footwear_transactions`
- `volunteer_locations`
- `group_members`
- `emergency_contacts`
- `lost_found_cases`

### Need to Create ❌
- `crowd_history`
- `weather_data`
- `festival_calendar`
- `temple_capacity`
- `cross_temple_routes`
- `ropeway_schedule`
- `ropeway_capacity`
- `tide_timings`
- `ferry_capacity`
- `mela_mode_config`
- `audio_sensor_data`
- `panic_alerts`
- `premises_layout`
- `simulation_scenarios`
- `crowd_flow_patterns`
- `prasad_queue_tokens`
- `bhandara_counters`
- `queue_status`
- `parking_sensors`
- `shuttle_locations`
- `shuttle_routes`
- `audio_navigation`

---

## External API Integrations Required

1. **Weather API** - For crowd prediction
2. **Tide Timing API** - For Bet Dwarka boat slots
3. **Ropeway Operator API** - For Pavagadh sync
4. **Audio Sensor API** - For panic detection
5. **Parking Sensor API** - For smart parking
6. **Shuttle GPS API** - For shuttle tracking

---

## Next Steps

1. Run updated `database-setup.sql` in Supabase
2. Implement AI Crowd Prediction engine
3. Build Cross-Temple Circuit AI dashboard
4. Integrate Pavagadh Ropeway API
5. Integrate Bet Dwarka Tide API
6. Implement Mela Mode auto-activation
7. Build Prasad/Bhandara Queue system
8. Implement Smart Parking sensors
9. Add Audio Navigation to Priority Darshan
10. Build Command Centre oversight dashboard
