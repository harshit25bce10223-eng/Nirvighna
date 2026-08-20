# Nirvighna - Implementation Guide

**Date:** August 13, 2026  
**Version:** 1.0.0

---

## Pre-Implementation Checklist

- [ ] Backup database (Supabase export)
- [ ] Backup code (git commit)
- [ ] Verify .env file exists
- [ ] Test current functionality
- [ ] Get Supabase credentials

---

## Step 1: Temple ID Migration

**Pre-Change:** UUID temple IDs, booking page broken  
**Action:** Run `database-migration-fix.sql` in Supabase SQL Editor  
**Post-Change:** String temple IDs, booking works

```sql
-- Verify migration
SELECT id, name FROM temples;
-- Should show: tmp_somnath, tmp_dwarka, etc.
```

**Expected:** Booking page opens for all temples

---

## Step 2: API Key Configuration

**Pre-Change:** "No API key found" errors  
**Action:** Configure .env file

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Post-Change:** Database connection works

**Expected:** Signup/login works, no auth errors

---

## Step 3: Profile Edit Enhancement

**Pre-Change:** No medical info editing  
**Action:** Add edit form to Profile.jsx

```jsx
// Add state
const [isEditing, setIsEditing] = useState(false);
const [editForm, setEditForm] = useState({
  blood_group: '',
  medical_details: '',
  emergency_contact_name: '',
  emergency_contact_phone: ''
});

// Add update function
const handleProfileUpdate = async () => {
  await supabase.from('users').update(editForm).eq('id', currentUser.id);
};
```

**Post-Change:** Users can edit medical info

**Expected:** Blood group, medical details, emergency contacts editable

---

## Prana Kavach Integration

**Pre-Change:** Engine exists, no UI integration  
**Action:** Add to Command Centre

```jsx
import { pranaKavachEngine } from '../lib/pranaKavachEngine';

const readings = pranaKavachEngine.getLiveReadings(templeId);
// Display: temp, humidity, density, risk score
```

**Post-Change:** Real-time crowd risk monitoring

**Expected:** Command Centre shows zone-wise risk scores, dynamic capacity

---

## Drishti AI Integration

**Pre-Change:** Vision engine isolated  
**Action:** Add to volunteer scanner

```jsx
import { drishtiPipeline } from '../lib/drishtiVisionPipeline';

const faces = await drishtiPipeline.detectFacesInVideo(video, canvas);
// Display face count in scanner
```

**Post-Change:** Face detection in scanner, crowd counting in Command Centre

**Expected:** Volunteer scanner shows face count, Command Centre shows crowd density

---

## Acoustic Panic Integration

**Pre-Change:** Partial integration  
**Action:** Full Command Centre integration

```jsx
import { acousticPanicEngine } from '../lib/acousticPanicEngine';

const sensor = acousticPanicEngine.startLiveMicSensor(templeId, zone, onReading, onPanic);
// Display dB levels, trigger alerts on screams
```

**Post-Change:** Real-time acoustic monitoring with panic detection

**Expected:** Command Centre shows audio levels, triggers panic alerts

---

## Digital Twin Integration

**Pre-Change:** Engine exists, no UI  
**Action:** Add simulation to Command Centre

```jsx
import { digitalTwinEngine } from '../lib/digitalTwinEngine';

const simulation = digitalTwinEngine.runCrowdSimulation(templeId, expectedFootfall);
// Display crowd flow, bottlenecks
```

**Post-Change:** Pre-entry crowd simulation

**Expected:** Command Centre shows predicted crowd flow, bottleneck forecasts

---

## AI Crowd Engine Integration

**Pre-Change:** Engine exists, limited UI  
**Action:** Add predictions to Home page

```jsx
import { aiCrowdEngine } from '../lib/aiCrowdEngine';

const prediction = await aiCrowdEngine.getCrowdPrediction(templeId, date);
// Display optimal visiting times
```

**Post-Change:** AI predictions in booking flow

**Expected:** Home page shows crowd predictions, booking recommends best times

---

## Post-Implementation Verification

**Test Checklist:**
- [ ] Booking page opens for all temples
- [ ] Profile edit saves medical info
- [ ] Prana Kavach shows risk scores
- [ ] Drishti AI detects faces
- [ ] Acoustic engine detects screams
- [ ] Digital twin runs simulations
- [ ] AI crowd predictions display
- [ ] No console errors
- [ ] All existing features work

---

## Expected Functionality Summary

**After All Changes:**
- Booking system fully functional
- Medical information editable
- Real-time crowd risk monitoring
- AI-powered crowd predictions
- Face detection in volunteer scanner
- Acoustic panic detection
- Digital twin simulations
- Comprehensive safety monitoring

**User Experience:**
- Pilgrims see crowd predictions before booking
- Volunteers see face counts while scanning
- Admins see real-time risk metrics
- Emergency alerts trigger automatically
- Dynamic capacity recommendations guide pilgrims
