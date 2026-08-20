# Nirvighna - Temple Pilgrimage Crowd Management App

A comprehensive crowd management system for temple pilgrimages in Gujarat, featuring real-time monitoring, QR-based digital passes, medical emergency response, and multi-role interfaces for pilgrims, volunteers, and administrators.

## 🏛️ Supported Temples

- **Somnath Temple** - Veraval, Gujarat
- **Dwarkadhish Temple** - Dwarka, Gujarat (with boat crossing)
- **Ambaji Temple** - Banaskantha, Gujarat
- **Kalika Mata Temple** - Pavagadh, Gujarat (with ropeway)

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling with custom temple-themed color palette
- **Lucide React** - Icon library
- **QRCode** - QR code generation for digital passes
- **Web Speech API** - Voice navigation in Hindi, Gujarati, and English

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database with 14 tables
  - Row Level Security (RLS) policies
  - Real-time subscriptions
  - Authentication (auth.users integration)

### Hosting
- **Vercel** - Frontend deployment
- **Supabase** - Backend hosting

## 📋 Features

### Pilgrim Portal (Mobile Web App)
- **Sign-Up & Profile** - Full name, mobile number, emergency contacts, family group sub-profiles
- **Language Selector** - Persistent 1-tap switcher (Hindi, Gujarati, English)
- **Home & AI Engine** - Live capacity percentages, cross-temple circuit AI recommendations
- **Ambaji Bhadarvi Poonam Mela Mode** - Padyatri safety check-in points
- **Prasad & Bhandara Queue Token** - Virtual queue token system
- **Darshan Booking** - General/VIP slot toggle, time slot availability grid, priority requests
- **Digital Pilgrim Pass** - QR codes for primary pilgrims and group members
- **Smart Parking & Mobility** - Parking availability, shuttle GPS ETA, boat ferry timing
- **Priority & Voice Navigation** - Category declaration, Web Speech API guidance
- **Offline Counter Booking** - Physical kiosk form for pilgrims without smartphones

### Volunteer Hub (Ground Staff App)
- **Dashboard** - Zone assignment, QR scanning, family reunification, footwear locker management
- **Privacy-Protected Gate Scanner** - Gate validation with privacy-first data handling
- **Medical Emergency Response** - Real-time status stepper (Open → En Route → Reached → Resolved)

### Temple Command Centre (Admin Control Room)
- **Main Control Room** - Real-time floorplan heatmap, IoT & drone CCTV feeds
- **Sound-Based Acoustic Panic Monitor** - Ambient audio spike detection
- **Pre-Entry Digital Twin Simulator** - Crowd-flow simulation & bottleneck forecasting
- **Traffic Control & Police Link** - Congestion feed with diversion signals
- **Temple Analytics** - Visitor counts, pass splits, donation totals, volunteer stats

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Nirvighna
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Setup

#### Create a Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Navigate to SQL Editor and run the `schema.sql` file to create all tables

#### Configure Environment Variables
1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Get your Supabase credentials:
   - From your Supabase project dashboard → Settings → API
   - Copy `Project URL` and `anon public` key

3. Update `.env` with your credentials:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
Nirvighna/
├── src/
│   ├── components/          # React components
│   │   ├── AdminDashboard.jsx
│   │   ├── DarshanBooking.jsx
│   │   ├── DigitalPass.jsx
│   │   ├── MedicalAlertResponse.jsx
│   │   ├── Navbar.jsx
│   │   ├── OfflineCounterBooking.jsx
│   │   ├── PilgrimHome.jsx
│   │   ├── PriorityAudioNav.jsx
│   │   ├── SignupLogin.jsx
│   │   ├── SmartTravel.jsx
│   │   ├── VolunteerDashboard.jsx
│   │   └── VolunteerScanResult.jsx
│   ├── context/             # React Context
│   │   └── AuthContext.jsx
│   ├── lib/                 # Utilities
│   │   └── supabaseClient.js
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── schema.sql               # Database schema
├── tailwind.config.js       # Tailwind configuration
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies
```

## 🗄️ Database Schema

The app uses 14 PostgreSQL tables:

1. **temples** - Temple information and live capacity
2. **users** - User profiles linked to auth.users
3. **emergency_contacts** - Emergency contact information
4. **group_members** - Family members under one booking
5. **darshan_slots** - Time slots for darshan bookings
6. **bookings** - Pilgrim bookings with shared codes
7. **qr_passes** - Digital QR passes for each pilgrim
8. **medical_alerts** - Medical emergency cases
9. **lost_found_cases** - Lost and found management
10. **crowd_density_logs** - Real-time crowd monitoring
11. **parking_status** - Parking availability
12. **shuttle_tracking** - Shuttle bus GPS tracking
13. **donations** - Temple donations
14. **notifications** - User notifications

All tables include:
- UUID primary keys
- Foreign key relationships
- Check constraints for status/role/type fields
- Row Level Security (RLS) policies
- Performance indexes

## 🎨 Custom Color Palette

The app uses a temple-inspired color scheme:

- **Indigo Dark** (`#1B2A4A`) - Primary dark color
- **Gold** (`#E3A32A`) - Accent color for highlights
- **Ivory** (`#FAF7F0`) - Background color
- **Maroon** (`#8C2F39`) - Primary action color
- **Alert Red** (`#C1443C`) - Emergency alerts
- **Success Green** (`#3F7D5C`) - Success states

## 🚢 Deployment

### Frontend (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Backend (Supabase)

The backend is already hosted on Supabase. No additional deployment needed.

## 🔐 Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Role-based access control** - Pilgrim, Volunteer, Admin roles
- **Privacy-protected scanning** - Volunteer scanner hides personal data by default
- **Medical data protection** - Emergency contacts only revealed when needed

## 🌐 Multi-Language Support

The app supports three languages:
- **English** (default)
- **Hindi** (हिंदी)
- **Gujarati** (ગુજરાતી)

Language preference is stored per user and persists across sessions.

## 📱 Mobile Responsiveness

The app is designed as a mobile-first web application with:
- Touch-friendly interface
- Bottom navigation bar for pilgrims
- Optimized for small screens
- Offline counter booking for users without smartphones

## 🧪 Testing

To test the app without Supabase, the mock state in `src/lib/supabaseClient.js` provides sample data for:
- User profiles
- Temple information
- Bookings and QR passes
- Medical alerts
- Crowd density data

## SIH Jury Demo Flow

Use this short, transparent storyline in the Command Centre. It is clearly labelled **Demo Scenario** in the interface; it demonstrates the response workflow and does not claim a live emergency.

1. Sign in to the Command Centre and select a temple hub.
2. On **Overview**, click **Run surge response** in the *SIH Safety Response Loop*.
3. Show the predicted Gate 1 surge and recommended Gate 2 diversion.
4. Explain the coordinated outputs: a pilgrim safety advisory, LED signage command, and four-volunteer field dispatch are generated together.
5. Click **Verify outcome** to show the before/after density and wait-time result.

Present this as: **forecast → coordinated intervention → verified crowd-safety outcome**.

## 📝 License

This project is part of the Nirvighna initiative for temple pilgrimage management in Gujarat.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows the existing style
- Components are properly documented
- Database changes are reflected in schema.sql
- RLS policies are updated for new tables

## 📞 Support

For issues or questions, please contact the development team.
