// Master temple registry and data

export const MASTER_TEMPLES = [
  {
    id: 'tmp_somnath',
    name: 'Shri Somnath Jyotirlinga Temple',
    name_hi: 'श्री सोमनाथ ज्योतिर्लिंग मंदिर',
    name_gu: 'શ્રી સોમનાથ જ્યોતિર્લિંગ મંદિર',
    location: 'Veraval, Gir Somnath, Gujarat',
    location_hi: 'वेरावल, गिर सोमनाथ, गुजरात',
    location_gu: 'વેરાવળ, ગીર સોમનાથ, ગુજરાત',
    live_capacity_percentage: 45,
    crowdLevel: 'medium',
    tag: '1st Jyotirlinga',
    image_url: '/images/temples/somnath.png',
    deity: 'Lord Shiva (Somnath Mahadev)',
    gates: [
      { id: 'som_g1', name: 'Mahapravesh Dwar', type: 'entry_and_exit', desc: 'Main General Entrance & Exit Gate (Deposit Counter Near Entrance)', is_priority_lane: false },
      { id: 'som_g2', name: 'Wheelchair Accessible Gate', type: 'entry_and_exit', desc: 'Senior Citizen & Wheelchair Priority Gate', is_priority_lane: true }
    ],
    zones: [
      { id: 'zone_som_1', label: 'Mahapravesh Dwar Main Queue', baseTemp: 33, baseHumidity: 65, baseDensity: 0.58 },
      { id: 'zone_som_2', label: 'Wheelchair Priority Line', baseTemp: 31, baseHumidity: 58, baseDensity: 0.35 },
      { id: 'zone_som_3', label: 'Seafront Promenade Corridor', baseTemp: 34, baseHumidity: 75, baseDensity: 0.72 },
      { id: 'zone_som_4', label: 'Prasad Distribution Counter', baseTemp: 30, baseHumidity: 52, baseDensity: 0.40 },
      { id: 'zone_som_5', label: 'Light & Sound Show Ground', baseTemp: 29, baseHumidity: 50, baseDensity: 0.28 }
    ],
    emergencyExits: [
      { id: 'EX_SOM_1', label: 'Mahapravesh North Emergency Gate', zone: 'Mahapravesh Dwar Main Queue', walkTime: '2 min', staffNeeded: 2 },
      { id: 'EX_SOM_2', label: 'Seafront Promenade Evacuation Way', zone: 'Seafront Promenade Corridor', walkTime: '3 min', staffNeeded: 3 },
      { id: 'EX_SOM_3', label: 'Helipad VIP Exit Gate', zone: 'Wheelchair Priority Line', walkTime: '1 min', staffNeeded: 1 }
    ],
    cameras: [
      { id: 'cam_som_1', name: 'Mahapravesh Dwar Main Camera', headcount: 142, load: 84 },
      { id: 'cam_som_2', name: 'Wheelchair Priority Camera', headcount: 65, load: 38 },
      { id: 'cam_som_3', name: 'Seafront Corridor Camera', headcount: 195, load: 78 },
      { id: 'cam_som_4', name: 'Prasad Queue Camera', headcount: 88, load: 45 }
    ],
    aarti: '07:00 AM (Pratah) • 12:00 PM (Madhyahn) • 07:00 PM (Sandhya Mahacart)',
    transitHub: {
      nearestRail: {
        name: 'Somnath Railway Station (SMNH)',
        name_hi: 'सोमनाथ रेलवे स्टेशन (SMNH)',
        name_gu: 'સોમનાથ રેલવે સ્ટેશન (SMNH)',
        distance: '1.5 km',
        distance_hi: '1.5 किमी',
        distance_gu: '1.5 કિમી',
        secondary: 'Veraval Junction (VRL) • 6 km',
        secondary_hi: 'वेरावल जंक्शन (VRL) • 6 किमी',
        secondary_gu: 'વેરાવળ જંકશન (VRL) • 6 કિમી'
      },
      nearestAirport: {
        name: 'Diu Airport (DIU)',
        name_hi: 'दीव हवाई अड्डा (DIU)',
        name_gu: 'દીવ એરપોર્ટ (DIU)',
        distance: '85 km',
        distance_hi: '85 किमी',
        distance_gu: '85 કિમી',
        secondary: 'Rajkot International Airport (HSR) • 200 km',
        secondary_hi: 'राजकोट अंतर्राष्ट्रीय हवाई अड्डा (HSR) • 200 किमी',
        secondary_gu: 'રાજકોટ આંતરરાષ્ટ્રીય એરપોર્ટ (HSR) • 200 કિમી'
      },
      localTransit: {
        name: 'GSRTC Somnath Central Bus Stand',
        name_hi: 'GSRTC सोमनाथ सेंट्रल बस स्टैंड',
        name_gu: 'GSRTC સોમનાથ સેન્ટ્રલ બસ સ્ટેન્ડ',
        distance: '800 m',
        distance_hi: '800 मीटर',
        distance_gu: '800 મીટર',
        secondary: 'Veraval Central Bus Station (7 km) & E-Battery Carts',
        secondary_hi: 'वेरावल केंद्रीय बस डिपो (7 किमी) एवं ई-बैटरी कार्ट',
        secondary_gu: 'વેરાવળ સેન્ટ્રલ બસ ડેપો (7 કિમી) અને ઈ-બેટરી કાર્ટ'
      }
    },
    parkingLots: [
      { id: 'p_som_1', zone: 'Lot A', name: 'Veneshwar Mandir Main Parking (P1)', name_hi: 'वेणेश्वर मंदिर मुख्य वाहन पार्किंग (P1)', name_gu: 'વેણેશ્વર મંદિર મુખ્ય વાહન પાર્કિંગ (P1)', total: 600, occupied: 240, available: 360, distance: '150m from Mahapravesh Dwar', distance_hi: 'महाप्रवेश द्वार से 150 मीटर', distance_gu: 'મહાપ્રવેશ દ્વારથી 150 મીટર', hasShuttle: true, evCharging: true },
      { id: 'p_som_2', zone: 'Lot B', name: 'Somnath Helipad Seafront Parking (P2)', name_hi: 'सोमनाथ हेलीपैड समुद्रतट पार्किंग (P2)', name_gu: 'સોમનાથ હેલિપેડ દરિયાકાંઠા પાર્કિંગ (P2)', total: 300, occupied: 110, available: 190, distance: '50m from Senior Citizen Gate', distance_hi: 'वरिष्ठ नागरिक गेट से 50 मीटर', distance_gu: 'વરિષ્ઠ નાગરિક ગેટથી 50 મીટર', hasShuttle: true, evCharging: true },
      { id: 'p_som_3', zone: 'Lot C', name: 'Triveni Sangam Ghat Parking (P3)', name_hi: 'त्रिवेणी संगम घाट वाहन पार्किंग (P3)', name_gu: 'ત્રિવેણી સંગમ ઘાટ વાહન પાર્કિંગ (P3)', total: 450, occupied: 180, available: 270, distance: '400m from Beach Promenade', distance_hi: 'समुद्र तट से 400 मीटर', distance_gu: 'દરિયાકાંઠાથી 400 મીટર', hasShuttle: true, evCharging: false }
    ],
    shuttles: [
      { id: 's_som_1', shuttle_id: 'SH-01', name: 'Mini Electric Train Shuttle', name_hi: 'मिनी इलेक्ट्रिक ट्रेन शटल', name_gu: 'મિની ઇલેક્ટ્રિક ટ્રેન શટલ', eta: '3 mins', nextDeparture: 3, frequency: 5, route: 'Veneshwar Parking ↔ Mahapravesh Gate 1', route_hi: 'वेणेश्वर पार्किंग ↔ महाप्रवेश द्वार 1', route_gu: 'વેણેશ્વર પાર્કિંગ ↔ મહાપ્રવેશ દ્વાર 1', current_occupancy: 6, capacity: 8, status: 'en_route', destination: 'Mahapravesh Gate 1', fare: 'Free', fare_hi: 'निःशुल्क', fare_gu: 'મફત' },
      { id: 's_som_2', shuttle_id: 'SH-02', name: 'Somnath Beach Promenade Battery Cart', name_hi: 'सोमनाथ बीच प्रोमेनेड बैटरी कार्ट', name_gu: 'સોમનાથ બીચ પ્રોમેનેડ બેટરી કાર્ટ', eta: '2 mins', nextDeparture: 2, frequency: 5, route: 'Promenade Parking B ↔ Wheelchair Gate 2', route_hi: 'प्रोमेनेड पार्किंग B ↔ व्हीलचेयर गेट 2', route_gu: 'પ્રોમેનેડ પાર્કિંગ B ↔ વ્હીલચેર ગેટ 2', current_occupancy: 8, capacity: 10, status: 'loading', destination: 'Wheelchair Gate 2', fare: 'Free', fare_hi: 'निःशुल्क', fare_gu: 'મફત' },
      { id: 's_som_3', shuttle_id: 'SH-03', name: 'Triveni Sangam Pilgrim Express', name_hi: 'त्रिवेणी संगम तीर्थ एक्सप्रेस', name_gu: 'ત્રિવેણી સંગમ યાત્રાળુ એક્સપ્રેસ', eta: '6 mins', nextDeparture: 6, frequency: 10, route: 'Triveni Sangam Ghat ↔ Somnath Temple Main Gate', route_hi: 'त्रिवेणी संगम घाट ↔ सोमनाथ मंदिर मुख्य द्वार', route_gu: 'ત્રિવેણી સંગમ ઘાટ ↔ સોમનાથ મંદિર મુખ્ય દ્વાર', current_occupancy: 22, capacity: 30, status: 'en_route', destination: 'Somnath Main Gate', fare: '₹10', fare_hi: '₹10', fare_gu: '₹10' }
    ],
    aiForecast: 'Optimal morning Darshan between 07:30 AM - 09:30 AM. Expected evening rush during 07:00 PM Light & Sound Show.'
  },
  {
    id: 'tmp_dwarka',
    name: 'Shri Dwarkadhish Mandir (Jagat Mandir)',
    name_hi: 'श्री द्वारकाधीश जगत मंदिर',
    name_gu: 'શ્રી દ્વારકાધીશ જગત મંદિર',
    location: 'Dwarka, Devbhumi Dwarka, Gujarat',
    location_hi: 'द्वारका, देवभूमि द्वारका, गुजरात',
    location_gu: 'દ્વારકા, દેવભૂમિ દ્વારકા, ગુજરાત',
    live_capacity_percentage: 82,
    crowdLevel: 'high',
    has_boat_crossing: true,
    tag: 'Char Dham & Mokshapuri',
    image_url: '/images/temples/dwarka.png',
    deity: 'Lord Krishna (Dwarkadhish - Jagat Mandir)',
    gates: [
      { id: 'dwa_g1', name: 'Swarga Dwar', type: 'entry', desc: 'Entry Gate (South Side near Gomti Ghat, 56 Steps)', is_priority_lane: false },
      { id: 'dwa_g2', name: 'Moksha Dwar', type: 'exit', desc: 'Exit Gate (Main Front Gate near Market, Lockers & Footwear Counter)', is_priority_lane: false }
    ],
    zones: [
      { id: 'zone_dwa_1', label: 'Swarga Dwar Entry Queue', baseTemp: 35, baseHumidity: 78, baseDensity: 0.84 },
      { id: 'zone_dwa_2', label: 'Moksha Dwar Exit & Lockers', baseTemp: 32, baseHumidity: 62, baseDensity: 0.45 },
      { id: 'zone_dwa_3', label: 'Gomti Ghat Steps Queue', baseTemp: 36, baseHumidity: 82, baseDensity: 0.88 },
      { id: 'zone_dwa_4', label: 'Sudama Setu Footbridge Access', baseTemp: 33, baseHumidity: 70, baseDensity: 0.65 },
      { id: 'zone_dwa_5', label: 'Bet Dwarka Ferry Terminal', baseTemp: 31, baseHumidity: 68, baseDensity: 0.50 }
    ],
    emergencyExits: [
      { id: 'EX_DWA_1', label: 'Swarga Dwar Gomti Exit Gate', zone: 'Swarga Dwar Entry Queue', walkTime: '2 min', staffNeeded: 3 },
      { id: 'EX_DWA_2', label: 'Sudama Setu Emergency Way', zone: 'Sudama Setu Footbridge Access', walkTime: '3 min', staffNeeded: 2 },
      { id: 'EX_DWA_3', label: 'Okha Ferry Pier Emergency Exit', zone: 'Bet Dwarka Ferry Terminal', walkTime: '4 min', staffNeeded: 3 }
    ],
    cameras: [
      { id: 'cam_dwa_1', name: 'Swarga Dwar Entry Camera', headcount: 188, load: 92 },
      { id: 'cam_dwa_2', name: 'Moksha Dwar Exit Camera', headcount: 92, load: 48 },
      { id: 'cam_dwa_3', name: 'Gomti Ghat Camera', headcount: 210, load: 89 },
      { id: 'cam_dwa_4', name: 'Sudama Setu Camera', headcount: 110, load: 68 }
    ],
    aarti: '06:30 AM (Mangla Aarti) • 10:30 AM (Shringarakar) • 07:30 PM (Sandhya Aarti)',
    transitHub: {
      nearestRail: {
        name: 'Dwarka Railway Station (DWK)',
        name_hi: 'द्वारका रेलवे स्टेशन (DWK)',
        name_gu: 'દ્વારકા રેલવે સ્ટેશન (DWK)',
        distance: '2.5 km',
        distance_hi: '2.5 किमी',
        distance_gu: '2.5 કિમી',
        secondary: 'Okha Railway Station (OKHA) • 30 km',
        secondary_hi: 'ओखा रेलवे स्टेशन (OKHA) • 30 किमी',
        secondary_gu: 'ઓખા રેલવે સ્ટેશન (OKHA) • 30 કિમી'
      },
      nearestAirport: {
        name: 'Jamnagar Airport (JGA)',
        name_hi: 'जामनगर हवाई अड्डा (JGA)',
        name_gu: 'જામનગર એરપોર્ટ (JGA)',
        distance: '130 km',
        distance_hi: '130 किमी',
        distance_gu: '130 કિમી',
        secondary: 'Porbandar Airport (PBD) • 105 km',
        secondary_hi: 'पोरबंदर हवाई अड्डा (PBD) • 105 किमी',
        secondary_gu: 'પોરબंदर એરપોર્ટ (PBD) • 105 કિમી'
      },
      localTransit: {
        name: 'GSRTC Dwarka Central Bus Station',
        name_hi: 'GSRTC द्वारका सेंट्रल बस स्टेशन',
        name_gu: 'GSRTC દ્વારકા સેન્ટ્રલ બસ સ્ટેશન',
        distance: '1.2 km',
        distance_hi: '1.2 किमी',
        distance_gu: '1.2 કિમી',
        secondary: 'Bhadrakali Road Terminal & Okha Ferry Pier (30 km)',
        secondary_hi: 'भद्रकाली रोड बस टर्मिनल एवं ओखा नौका घाट (30 किमी)',
        secondary_gu: 'ભદ્રકાલી રોડ બસ ટર્મિનલ અને ઓખા બોટ ઘાટ (30 કિમી)'
      }
    },
    parkingLots: [
      { id: 'p_dwa_1', zone: 'Lot Gomti', name: 'Gomti Ghat Main Parking (P1)', name_hi: 'गोमती घाट मुख्य वाहन पार्किंग (P1)', name_gu: 'ગોમતી ઘાટ મુખ્ય વાહન પાર્કિંગ (P1)', total: 800, occupied: 680, available: 120, distance: '350m from Swarga Dwar', distance_hi: 'स्वर्ग द्वार से 350 मीटर', distance_gu: 'સ્વર્ગ દ્વારથી 350 મીટર', hasShuttle: true, evCharging: true },
      { id: 'p_dwa_2', zone: 'Lot Okha', name: 'Okha Port Ferry Pier Parking (P2)', name_hi: 'ओखा पोर्ट नौका घाट पार्किंग (P2)', name_gu: 'ઓખા પોર્ટ બોટ ઘાટ પાર્કિંગ (P2)', total: 600, occupied: 210, available: 390, distance: 'Direct Ferry Terminal Access', distance_hi: 'सीधा नौका टर्मिनल प्रवेश', distance_gu: 'સીધો બોટ ટર્મિનલ પ્રવેશ', hasShuttle: true, evCharging: false },
      { id: 'p_dwa_3', zone: 'Lot BusStand', name: 'Dwarka City Terminal Parking (P3)', name_hi: 'द्वारका सिटी बस टर्मिनल पार्किंग (P3)', name_gu: 'દ્વારકા સિટી બસ ટર્મિનલ પાર્કિંગ (P3)', total: 400, occupied: 150, available: 250, distance: '200m from Moksha Dwar', distance_hi: 'मोक्ष द्वार से 200 मीटर', distance_gu: 'મોક્ષ દ્વારથી 200 મીટર', hasShuttle: true, evCharging: false }
    ],
    shuttles: [
      { id: 's_dwa_1', shuttle_id: 'SH-04', name: 'Dwarka Senior Citizen Battery Cart', name_hi: 'द्वारका वरिष्ठ नागरिक बैटरी कार्ट', name_gu: 'દ્વારકા વરિષ્ઠ નાગરિક બેટરી કાર્ટ', eta: '2 mins', nextDeparture: 2, frequency: 4, route: 'Moksha Dwar Lockers ↔ Swarga Dwar 56 Steps Ramp', route_hi: 'मोक्ष द्वार लॉकर ↔ स्वर्ग द्वार 56 सीढ़ी रैंप', route_gu: 'મોક્ષ દ્વાર લોકર ↔ સ્વર્ગ દ્વાર 56 પગથિયાં રેમ્પ', current_occupancy: 6, capacity: 6, status: 'loading', destination: 'Swarga Dwar Ramp', fare: 'Free', fare_hi: 'निःशुल्क', fare_gu: 'મફત' },
      { id: 's_dwa_2', shuttle_id: 'SH-05', name: 'Okha Port Bet Dwarka Ferry Express', name_hi: 'ओखा पोर्ट बेट द्वारका नौका एक्सप्रेस', name_gu: 'ઓખા પોર્ટ બેટ દ્વારકા બોટ એક્સપ્રેસ', eta: '7 mins', nextDeparture: 7, frequency: 15, route: 'Dwarka Bus Stand ↔ Okha Ferry Pier (Bet Dwarka)', route_hi: 'द्वारका बस स्टैंड ↔ ओखा नौका घाट (बेट द्वारका)', route_gu: 'દ્વારકા બસ સ્ટેન્ડ ↔ ઓખા બોટ ઘાટ (બેટ દ્વારકા)', current_occupancy: 38, capacity: 45, status: 'en_route', destination: 'Okha Passenger Jetty', fare: '₹20', fare_hi: '₹20', fare_gu: '₹20' },
      { id: 's_dwa_3', shuttle_id: 'SH-06', name: 'Rukmini Mandir Pilgrim Connector', name_hi: 'रुक्मिणी मंदिर तीर्थ कनेक्टर', name_gu: 'રુક્મિણી મંદિર યાત્રાળુ કનેક્ટર', eta: '10 mins', nextDeparture: 10, frequency: 20, route: 'Dwarkadhish Main Shrine ↔ Rukmini Devi Mandir', route_hi: 'द्वारकाधीश मुख्य मंदिर ↔ रुक्मिणी देवी मंदिर', route_gu: 'દ્વારકાધીશ મુખ્ય मंदिर ↔ રુક્મિણી દેવી મંદિર', current_occupancy: 24, capacity: 35, status: 'en_route', destination: 'Rukmini Mandir', fare: '₹30', fare_hi: '₹30', fare_gu: '₹30' }
    ],
    aiForecast: 'High queue density (82%). Peaking at 10:30 AM Shringarakar. Peak reduction expected around 02:00 PM.'
  },
  {
    id: 'tmp_ambaji',
    name: 'Shri Arasuri Ambaji Shakti Peeth',
    name_hi: 'श्री आरासुरी अंबाजी शक्तिपीठ',
    name_gu: 'શ્રી આરાસુરી અંબાજી શક્તિપીઠ',
    location: 'Banaskantha, Gujarat',
    location_hi: 'बनासकांठा, गुजरात',
    location_gu: 'બનાસકાંઠા, ગુજરાત',
    live_capacity_percentage: 35,
    crowdLevel: 'low',
    tag: '51 Shakti Peeth Hub',
    image_url: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=800&q=80',
    deity: 'Goddess Amba (Holy Visa Yantra)',
    gates: [
      { id: 'amb_g1', name: 'Shakti Dwar - Central', type: 'entry_and_exit', desc: 'Main Central Opening (Largest of 5 Gate Complex)', is_priority_lane: false },
      { id: 'amb_g2', name: 'Shakti Dwar - Gate 7', type: 'entry', desc: 'Gate 7 (Priority / VIP / Senior Citizen Lane)', is_priority_lane: true },
      { id: 'amb_g3', name: 'Shakti Dwar - Side Openings', type: 'entry_and_exit', desc: 'Flanking Side Gates (General Queue Flow)', is_priority_lane: false }
    ],
    zones: [
      { id: 'zone_amb_1', label: 'Shakti Dwar Central Main Entrance', baseTemp: 32, baseHumidity: 58, baseDensity: 0.40 },
      { id: 'zone_amb_2', label: 'Shakti Dwar Gate 7 Priority Lane', baseTemp: 30, baseHumidity: 52, baseDensity: 0.25 },
      { id: 'zone_amb_3', label: 'Chachar Chowk Courtyard', baseTemp: 34, baseHumidity: 64, baseDensity: 0.48 },
      { id: 'zone_amb_4', label: 'Gabbar Hill Ropeway Terminal', baseTemp: 30, baseHumidity: 52, baseDensity: 0.35 }
    ],
    emergencyExits: [
      { id: 'EX_AMB_1', label: 'Chachar Chowk Emergency Gate 1', zone: 'Chachar Chowk Courtyard', walkTime: '2 min', staffNeeded: 2 },
      { id: 'EX_AMB_2', label: 'Gabbar Ropeway Emergency Way', zone: 'Gabbar Hill Ropeway Terminal', walkTime: '3 min', staffNeeded: 2 }
    ],
    cameras: [
      { id: 'cam_amb_1', name: 'Shakti Dwar Central Camera', headcount: 85, load: 40 },
      { id: 'cam_amb_2', name: 'Gate 7 Priority Camera', headcount: 35, load: 18 },
      { id: 'cam_amb_3', name: 'Chachar Chowk Camera', headcount: 112, load: 48 }
    ],
    aarti: '07:30 AM (Pratah) • 12:30 PM (Rajbhog) • 06:30 PM (Sandhya Aarti)',
    transitHub: {
      nearestRail: {
        name: 'Abu Road Railway Station (ABR)',
        name_hi: 'आबू रोड रेलवे स्टेशन (ABR)',
        name_gu: 'આબુ રોડ રેલવે સ્ટેશન (ABR)',
        distance: '20 km',
        distance_hi: '20 किमी',
        distance_gu: '20 કિમી',
        secondary: 'Palanpur Junction (PNU) • 65 km',
        secondary_hi: 'पालनपुर जंक्शन (PNU) • 65 किमी',
        secondary_gu: 'પાલનપુર જંકશન (PNU) • 65 કિમી'
      },
      nearestAirport: {
        name: 'Sardar Vallabhbhai Patel Int\'l (AMD)',
        name_hi: 'सरदार वल्लभभाई पटेल अंतर्राष्ट्रीय हवाई अड्डा (AMD)',
        name_gu: 'સરદાર વલ્લભભાઈ પટેલ આંતરરાષ્ટ્રીય એરપોર્ટ (AMD)',
        distance: '180 km',
        distance_hi: '180 किमी',
        distance_gu: '180 કિમી',
        secondary: 'Maharana Pratap Airport Udaipur (UDR) • 165 km',
        secondary_hi: 'महाराणा प्रताप हवाई अड्डा उदयपुर (UDR) • 165 किमी',
        secondary_gu: 'મહારાણા પ્રતાપ એરપોર્ટ ઉદયપુર (UDR) • 165 કિમી'
      },
      localTransit: {
        name: 'GSRTC Ambaji Central Bus Station',
        name_hi: 'GSRTC अंबाजी सेंट्रल बस स्टेशन',
        name_gu: 'GSRTC અંબાજી સેન્ટ્રલ બસ સ્ટેશન',
        distance: '800 m',
        distance_hi: '800 मीटर',
        distance_gu: '800 મીટર',
        secondary: 'Gabbar Hill E-Shuttle Terminal & Udan Khatola',
        secondary_hi: 'गब्बर हिल ई-शटल टर्मिनल एवं उड़न खटोला बेस',
        secondary_gu: 'ગબ્બર હિલ ઈ-શટલ ટર્મિનલ અને ઉડન ખટોલા બેઝ'
      }
    },
    parkingLots: [
      { id: 'p_amb_1', zone: 'Lot GabbarTeli', name: 'Gabbar Hill Ropeway Parking (P1)', name_hi: 'गब्बर हिल रोपवे वाहन पार्किंग (P1)', name_gu: 'ગબ્બર હિલ રોપવે વાહન પાર્કિંગ (P1)', total: 1000, occupied: 320, available: 680, distance: '150m from Shakti Dwar', distance_hi: 'शक्ति द्वार से 150 मीटर', distance_gu: 'શક્તિ દ્વારથી 150 મીટર', hasShuttle: true, evCharging: true },
      { id: 'p_amb_2', zone: 'Lot Chachar', name: 'Chachar Chowk Mandir Parking (P2)', name_hi: 'चाचर चौक मंदिर पार्किंग (P2)', name_gu: 'ચાચર ચોક मंदिर પાર્કિંગ (P2)', total: 700, occupied: 250, available: 450, distance: '100m from Gate 7 Priority Lane', distance_hi: 'गेट 7 वीआईपी से 100 मीटर', distance_gu: 'ગેટ 7 વીઆઈપીથી 100 મીટર', hasShuttle: true, evCharging: false },
      { id: 'p_amb_3', zone: 'Lot MelaP1', name: 'Palanpur Highway Padyatri Parking (P3)', name_hi: 'पालनपुर हाईवे पदयात्री वाहन पार्किंग (P3)', name_gu: 'પાલનપુર હાઇવે પદયાત્રી વાહન પાર્કિંગ (P3)', total: 1500, occupied: 410, available: 1090, distance: 'Highway Checkpoint Feeder', distance_hi: 'हाईवे चेकपॉइंट शटल बिंदु', distance_gu: 'હાઇવે ચેકપોઇન્ટ શટલ પોઇન્ટ', hasShuttle: true, evCharging: false }
    ],
    shuttles: [
      { id: 's_amb_1', shuttle_id: 'SH-07', name: 'Ambaji Gate 7 Senior Electric Cart', name_hi: 'अंबाजी गेट 7 वरिष्ठ इलेक्ट्रिक कार्ट', name_gu: 'અંબાજી ગેટ 7 વરિષ્ઠ ઇલેક્ટ્રિક કાર્ટ', eta: '3 mins', nextDeparture: 3, frequency: 5, route: 'Gabbar Teli Parking ↔ Shakti Dwar Gate 7 VIP', route_hi: 'गब्बर तेली पार्किंग ↔ शक्ति द्वार गेट 7 वीआईपी', route_gu: 'ગબ્બર તેલી પાર્કિંગ ↔ શક્તિ દ્વાર ગેટ 7 વીઆઈપી', current_occupancy: 6, capacity: 8, status: 'loading', destination: 'Shakti Dwar Gate 7', fare: 'Free', fare_hi: 'निःशुल्क', fare_gu: 'મફત' },
      { id: 's_amb_2', shuttle_id: 'SH-08', name: 'Maa Ambadevi Udan Khatola Ropeway Shuttle', name_hi: 'मां अम्बादेवी उड़न खटोला रोपवे शटल', name_gu: 'મા અંબાાદેવી ઉડન ખટોલા રોપવે શટલ', eta: '5 mins', nextDeparture: 5, frequency: 10, route: 'Ambaji GSRTC Stand ↔ Gabbar Ropeway Base Station', route_hi: 'अंबाजी बस स्टैंड ↔ गब्बर रोपवे बेस स्टेशन', route_gu: 'અંબાજી બસ સ્ટેન્ડ ↔ ગબ્બર રોપવે બેઝ સ્ટેશન', current_occupancy: 26, capacity: 40, status: 'en_route', destination: 'Gabbar Ropeway Base', fare: '₹15', fare_hi: '₹15', fare_gu: '₹15' },
      { id: 's_amb_3', shuttle_id: 'SH-09', name: 'Bhadarvi Poonam Padyatri Relief Shuttle', name_hi: 'भादरवी पूनम पदयात्री राहत शटल', name_gu: 'ભાદરવી પૂનમ પદયાત્રી રાહત શટલ', eta: '8 mins', nextDeparture: 8, frequency: 15, route: 'Palanpur Highway Checkpoint ↔ Ambaji Ring Road', route_hi: 'पालनपुर हाईवे चेकपॉइंट ↔ अंबाजी रिंग रोड', route_gu: 'પાલનપુર હાઇવે ચેકપોઇન્ટ ↔ અંબાજી રિંગ રોડ', current_occupancy: 34, capacity: 45, status: 'en_route', destination: 'Ambaji Ring Road', fare: 'Free', fare_hi: 'निःशुल्क', fare_gu: 'મફત' }
    ],
    aiForecast: 'Serene Darshan conditions (35% capacity). Zero waiting time at Shakti Dwar Gate 7.'
  },
  {
    id: 'tmp_pavagadh',
    name: 'Shri Mahakalika Mata Temple',
    name_hi: 'श्री महाकालिका माता मंदिर',
    name_gu: 'શ્રી મહાકાલિકા માતા મંદિર',
    location: 'Pavagadh, Panchmahal, Gujarat',
    location_hi: 'पावागढ़, पंचमहाल, गुजरात',
    location_gu: 'પાવાગઢ, પંચમહાલ, ગુજરાત',
    live_capacity_percentage: 58,
    crowdLevel: 'medium',
    has_ropeway: true,
    tag: 'UNESCO World Heritage',
    image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    deity: 'Maa Mahakalika Mandir',
    gates: [
      { id: 'pav_g1', name: 'Machi Haveli Ropeway Station', type: 'entry_and_exit', desc: 'Ropeway Boarding Station (6 Persons / Cabin)', is_priority_lane: false },
      { id: 'pav_g2', name: 'Trekking Base Entry', type: 'entry_and_exit', desc: 'Trekking Stairway Entrance (~1800-2000 Steps Route)', is_priority_lane: false }
    ],
    zones: [
      { id: 'zone_pav_1', label: 'Machi Haveli Ropeway Boarding', baseTemp: 30, baseHumidity: 55, baseDensity: 0.62 },
      { id: 'zone_pav_2', label: 'Trekking Stairway Route', baseTemp: 32, baseHumidity: 60, baseDensity: 0.50 },
      { id: 'zone_pav_3', label: 'Hilltop Summit Stairs Queue', baseTemp: 28, baseHumidity: 50, baseDensity: 0.58 },
      { id: 'zone_pav_4', label: 'Kalika Mata Shikhara Darshan', baseTemp: 29, baseHumidity: 52, baseDensity: 0.65 }
    ],
    emergencyExits: [
      { id: 'EX_PAV_1', label: 'Machi Base Emergency Evacuation Ramp', zone: 'Machi Haveli Ropeway Boarding', walkTime: '3 min', staffNeeded: 3 },
      { id: 'EX_PAV_2', label: 'Hilltop Staircase Emergency Bypass', zone: 'Hilltop Summit Stairs Queue', walkTime: '4 min', staffNeeded: 4 }
    ],
    cameras: [
      { id: 'cam_pav_1', name: 'Machi Ropeway Station Camera', headcount: 140, load: 70 },
      { id: 'cam_pav_2', name: 'Trekking Base Stairs Camera', headcount: 95, load: 48 }
    ],
    aarti: '05:00 AM (Mangla) • 12:00 PM (Madhyahn) • 07:00 PM (Sandhya)',
    transitHub: {
      nearestRail: {
        name: 'Champaner Road Junction (CPN)',
        name_hi: 'चांपानेर रोड जंक्शन (CPN)',
        name_gu: 'ચાંપાનેર રોડ જંકશન (CPN)',
        distance: '15 km',
        distance_hi: '15 किमी',
        distance_gu: '15 કિમી',
        secondary: 'Vadodara Junction (BRC) • 45 km',
        secondary_hi: 'वडोदरा जंक्शन (BRC) • 45 किमी',
        secondary_gu: 'વડોદરા જંકશન (BRC) • 45 કિમી'
      },
      nearestAirport: {
        name: 'Vadodara Airport (BDQ)',
        name_hi: 'वडोदरा हवाई अड्डा (BDQ)',
        name_gu: 'વડોદરા એરપોર્ટ (BDQ)',
        distance: '42 km',
        distance_hi: '42 किमी',
        distance_gu: '42 કિમી',
        secondary: 'Sardar Vallabhbhai Patel Int\'l (AMD) • 145 km',
        secondary_hi: 'सरदार वल्लभभाई पटेल अंतर्राष्ट्रीय हवाई अड्डा (AMD) • 145 किमी',
        secondary_gu: 'સરદાર વલ્લભભાઈ पटेल આંતરરાષ્ટ્રીય એરપોર્ટ (AMD) • 145 કિમી'
      },
      localTransit: {
        name: 'GSRTC Manchi Base Bus Terminal',
        name_hi: 'GSRTC माची बेस बस टर्मिनल',
        name_gu: 'GSRTC માચી બેઝ બસ ટર્મિનલ',
        distance: '500 m',
        distance_hi: '500 मीटर',
        distance_gu: '500 મીટર',
        secondary: 'Halol GSRTC Bus Depot (8 km) & Ropeway Base',
        secondary_hi: 'हालोल GSRTC बस डिपो (8 किमी) एवं रोपवे बेस',
        secondary_gu: 'હાલોલ GSRTC બસ ડેપો (8 કિમી) અને રોપવે બેઝ'
      }
    },
    parkingLots: [
      { id: 'p_pav_1', zone: 'Lot Machi', name: 'Machi Ropeway Base Parking (P1)', name_hi: 'माची रोपवे बेस वाहन पार्किंग (P1)', name_gu: 'માચી રોપવે બેઝ વાહન પાર્કિંગ (P1)', total: 900, occupied: 520, available: 380, distance: 'Direct Ropeway Terminal', distance_hi: 'सीधा रोपवे टर्मिनल', distance_gu: 'સીધું રોપવે ટર્મિનલ', hasShuttle: true },
      { id: 'p_pav_2', zone: 'Lot Champaner', name: 'Champaner Heritage Gate Parking (P2)', name_hi: 'चांपानेर हेरिटेज गेट पार्किंग (P2)', name_gu: 'ચાંપાનેર હેરિટેજ ગેટ પાર્કિંગ (P2)', total: 450, occupied: 180, available: 270, distance: '1.2 km from Machi Base', distance_hi: 'माची बेस से 1.2 किमी', distance_gu: 'માચી બેઝથી 1.2 કિમી', hasShuttle: true },
      { id: 'p_pav_3', zone: 'Lot Halol', name: 'Vada Talav Mega Parking Ground (P3)', name_hi: 'वड़ा तलाव मुख्य वाहन पार्किंग (P3)', name_gu: 'વડા તળાવ મુખ્ય વાહન પાર્કિંગ (P3)', total: 800, occupied: 310, available: 490, distance: 'Direct Shuttle Service to Base', distance_hi: 'माची बेस हेतु सीधी शटल सेवा', distance_gu: 'માચી બેઝ માટે સીધી શટલ સેવા', hasShuttle: true }
    ],
    shuttles: [
      { id: 's_pav_1', shuttle_id: 'SH-10', name: 'Machi Ropeway Mountain Bus', name_hi: 'माची रोपवे माउंटेन बस', name_gu: 'માચી રોપવે માઉન્ટેન બસ', eta: '4 mins', nextDeparture: 4, frequency: 8, route: 'Champaner Heritage Gate P2 ↔ Machi Ropeway Station', route_hi: 'चांपानेर हेरिटेज गेट P2 ↔ माची रोपवे स्टेशन', route_gu: 'ચાંપાનેર હેરિટેજ ગેટ P2 ↔ માચી રોપવે સ્ટેશન', current_occupancy: 28, capacity: 35, status: 'en_route', destination: 'Machi Haveli Station', fare: '₹20', fare_hi: '₹20', fare_gu: '₹20' },
      { id: 's_pav_2', shuttle_id: 'SH-11', name: 'Pavagadh Senior Hill Electric Cart', name_hi: 'पावागढ़ वरिष्ठ हिल इलेक्ट्रिक कार्ट', name_gu: 'પાવાગઢ વરિષ્ઠ હિલ ઇલેક્ટ્રિક કાર્ટ', eta: '3 mins', nextDeparture: 3, frequency: 5, route: 'Machi Bus Terminal ↔ Trekking Staircase Entrance', route_hi: 'माची बस टर्मिनल ↔ ट्रैकिंग सीढ़ी प्रवेश', route_gu: 'માચી બસ ટર્મિનલ ↔ ટ્રેકિંગ પગથિયાં પ્રવેશ', current_occupancy: 6, capacity: 8, status: 'loading', destination: 'Staircase Entrance Ramp', fare: 'Free', fare_hi: 'निःशुल्क', fare_gu: 'મફત' },
      { id: 's_pav_3', shuttle_id: 'SH-12', name: 'Halol Station Pilgrim Connector Bus', name_hi: 'हालोल स्टेशन तीर्थ कनेक्टर बस', name_gu: 'હાલોલ સ્ટેશન યાત્રાળુ કનેક્ટર બસ', eta: '12 mins', nextDeparture: 12, frequency: 20, route: 'Halol Railway Station ↔ Machi Base Terminal', route_hi: 'हालोल रेलवे स्टेशन ↔ माची बेस टर्मिनल', route_gu: 'હાલોલ રેલવે સ્ટેશન ↔ માચી બેઝ ટર્મિનલ', current_occupancy: 30, capacity: 45, status: 'en_route', destination: 'Machi Base Terminal', fare: '₹25', fare_hi: '₹25', fare_gu: '₹25' }
    ],
    aiForecast: 'Ropeway queue wait time ~18 mins. Trekking route moving at normal pace.'
  }
];

export const getLocalizedTempleName = (temple, lang = 'en') => {
  if (!temple) return '';
  if (lang === 'hi') return temple.name_hi || temple.name;
  if (lang === 'gu') return temple.name_gu || temple.name;
  return temple.name;
};

export const getShortTempleName = (templeOrId, lang = 'en') => {
  const id = typeof templeOrId === 'string' ? templeOrId : (templeOrId?.id || 'tmp_somnath');
  const shortNames = {
    tmp_somnath: { en: 'Somnath Jyotirlinga', hi: 'सोमनाथ ज्योतिर्लिंग', gu: 'સોમનાથ જ્યોતિર્લિંગ' },
    tmp_dwarka: { en: 'Dwarkadhish Mandir', hi: 'द्वारकाधीश मंदिर', gu: 'દ્વારકાધીશ મંદિર' },
    tmp_ambaji: { en: 'Ambaji Shakti Peeth', hi: 'अंबाजी शक्तिपीठ', gu: 'અંબાજી શક્તિપીઠ' },
    tmp_pavagadh: { en: 'Pavagadh Kalika Mata', hi: 'पावागढ़ कालिका माता', gu: 'પાવાગઢ કાલિકા માતા' }
  };
  const target = shortNames[id] || shortNames.tmp_somnath;
  return target[lang] || target.en;
};

export const getMicroTempleName = (templeOrId, lang = 'en') => {
  const id = typeof templeOrId === 'string' ? templeOrId : (templeOrId?.id || 'tmp_somnath');
  const microNames = {
    tmp_somnath: { en: 'Somnath', hi: 'सोमनाथ', gu: 'સોમનાથ' },
    tmp_dwarka: { en: 'Dwarka', hi: 'द्वारका', gu: 'દ્વારકા' },
    tmp_ambaji: { en: 'Ambaji', hi: 'अंबाजी', gu: 'અંબાજી' },
    tmp_pavagadh: { en: 'Pavagadh', hi: 'पावागढ़', gu: 'પાવાગઢ' }
  };
  const target = microNames[id] || microNames.tmp_somnath;
  return target[lang] || target.en;
};

export const getLocalizedTempleLocation = (temple, lang = 'en') => {
  if (!temple) return '';
  if (lang === 'hi') return temple.location_hi || temple.location;
  if (lang === 'gu') return temple.location_gu || temple.location;
  return temple.location;
};

export const getTempleById = (templeId) => {
  return MASTER_TEMPLES.find(t => t.id === templeId) || MASTER_TEMPLES[0];
};

export const getUniqueTemples = (dbTemples = []) => {
  if (!dbTemples || dbTemples.length === 0) return MASTER_TEMPLES;

  const map = new Map();
  MASTER_TEMPLES.forEach(t => map.set(t.name.toLowerCase().trim(), t));

  dbTemples.forEach(d => {
    const key = (d.name || '').toLowerCase().trim();
    if (key && map.has(key)) {
      map.set(key, { ...map.get(key), ...d, id: map.get(key).id });
    }
  });

  return Array.from(map.values());
};

export const getLocalizedTemple = (templeOrId, lang = 'en') => {
  let normalizedId = 'tmp_somnath';
  let templeObj = null;

  if (typeof templeOrId === 'string') {
    const s = templeOrId.toLowerCase();
    if (s.includes('dwarka') || s.includes('dwarkadhish')) normalizedId = 'tmp_dwarka';
    else if (s.includes('amba') || s.includes('ambaji')) normalizedId = 'tmp_ambaji';
    else if (s.includes('kalika') || s.includes('pavagadh') || s.includes('mahakali')) normalizedId = 'tmp_pavagadh';
    else if (s.includes('somnath')) normalizedId = 'tmp_somnath';
    else normalizedId = templeOrId;

    templeObj = getTempleById(normalizedId);
  } else if (templeOrId && typeof templeOrId === 'object') {
    templeObj = templeOrId;
    const rawId = (templeOrId.id || '').toLowerCase();
    const rawName = (templeOrId.name || '').toLowerCase();

    if (rawId.includes('dwarka') || rawName.includes('dwarka') || rawName.includes('dwarkadhish')) normalizedId = 'tmp_dwarka';
    else if (rawId.includes('amba') || rawName.includes('amba') || rawName.includes('ambaji')) normalizedId = 'tmp_ambaji';
    else if (rawId.includes('kalika') || rawId.includes('pavagadh') || rawName.includes('kalika') || rawName.includes('pavagadh') || rawName.includes('mahakali')) normalizedId = 'tmp_pavagadh';
    else if (rawId.includes('somnath') || rawName.includes('somnath')) normalizedId = 'tmp_somnath';
    else normalizedId = templeOrId.id || 'tmp_somnath';
  }

  const localizedData = {
    tmp_somnath: {
      en: {
        name: 'Shri Somnath Jyotirlinga Temple',
        deity: 'Somnath Mahadev',
        location: 'Veraval, Gir Somnath, Gujarat'
      },
      hi: {
        name: 'श्री सोमनाथ ज्योतिर्लिंग मंदिर',
        deity: 'सोमनाथ महादेव',
        location: 'वेरावल, गिर सोमनाथ, गुजरात'
      },
      gu: {
        name: 'શ્રી સોમનાથ જ્યોતિર્લિંગ મંદિર',
        deity: 'સોમનાથ મહાદેવ',
        location: 'વેરાવળ, ગીર સોમનાથ, ગુજરાત'
      }
    },
    tmp_dwarka: {
      en: {
        name: 'Shri Dwarkadhish Mandir (Jagat Mandir)',
        deity: 'Dwarkadhish',
        location: 'Dwarka, Devbhumi Dwarka, Gujarat'
      },
      hi: {
        name: 'श्री द्वारकाधीश जगत मंदिर',
        deity: 'द्वारकाधीश',
        location: 'द्वारका, देवभूमि द्वारका, गुजरात'
      },
      gu: {
        name: 'શ્રી દ્વારકાધીશ જગત મંદિર',
        deity: 'દ્વારકાધીશ',
        location: 'દ્વારકા, દેવભૂમિ દ્વારકા, ગુજરાત'
      }
    },
    tmp_ambaji: {
      en: {
        name: 'Shri Arasuri Ambaji Shakti Peeth',
        deity: 'Arasuri Amba',
        location: 'Ambaji, Banaskantha, Gujarat'
      },
      hi: {
        name: 'श्री आरासुरी अंबाजी शक्तिपीठ',
        deity: 'अरासुरी अम्बा',
        location: 'अंबाजी, बनासकांठा, गुजरात'
      },
      gu: {
        name: 'શ્રી આરાસુરી અંબાજી શક્તિપીઠ',
        deity: 'આરાસુરી અંબા',
        location: 'અંબાજી, બનાસકાંઠા, ગુજરાત'
      }
    },
    tmp_pavagadh: {
      en: {
        name: 'Shri Mahakalika Mata Temple',
        deity: 'Maa Mahakali',
        location: 'Pavagadh Hill, Panchmahal, Gujarat'
      },
      hi: {
        name: 'श्री महाकालिका माता मंदिर',
        deity: 'माँ महाकाली',
        location: 'पावागढ़ पर्वत, पंचमहाल, गुजरात'
      },
      gu: {
        name: 'શ્રી મહાકાલિકા માતા મંદિર',
        deity: 'મા મહાકાળી',
        location: 'પાવાગઢ ડુંગર, પંચમહાલ, ગુજરાત'
      }
    }
  };

  const templeInfo = localizedData[normalizedId] || localizedData.tmp_somnath;
  const langInfo = templeInfo[lang] || templeInfo.en;

  return {
    ...(templeObj || {}),
    id: normalizedId,
    name: langInfo.name,
    deity: langInfo.deity,
    location: langInfo.location
  };
};

export const getTempleDisplayName = getLocalizedTemple;

export const getAllottedGate = (templeId, isPriority = false) => {
  const temple = getTempleById(templeId);
  if (isPriority) {
    return temple.gates.find(g => g.is_priority_lane || g.name.toLowerCase().includes('priority') || g.name.toLowerCase().includes('wheelchair') || g.name.includes('Gate 7')) || temple.gates[0];
  }
  return temple.gates[0];
};

export const TEMPLE_DUTY_POSTS = {
  tmp_somnath: [
    { id: 'post_som_1', name: 'Mahapravesh Gate 1 Entrance', hasRopeway: false, hasBoat: false },
    { id: 'post_som_2', name: 'Wheelchair Gate 2 (Priority Escort)', hasRopeway: false, hasBoat: false },
    { id: 'post_som_3', name: 'Seafront Promenade Queue Ramp', hasRopeway: false, hasBoat: false },
    { id: 'post_som_4', name: 'Triveni Sangam Ghat Pilgrim Station', hasRopeway: false, hasBoat: false }
  ],
  tmp_dwarka: [
    { id: 'post_dwa_1', name: 'Swarga Dwar Entry Queue (56 Steps)', hasRopeway: false, hasBoat: false },
    { id: 'post_dwa_2', name: 'Moksha Dwar Exit & Lockers', hasRopeway: false, hasBoat: false },
    { id: 'post_dwa_3', name: 'Gomti Ghat Steps Queue', hasRopeway: false, hasBoat: false },
    { id: 'post_dwa_4', name: 'Sudama Setu Footbridge Entry', hasRopeway: false, hasBoat: false },
    { id: 'post_dwa_5', name: 'Okha Passenger Pier (Bet Dwarka Boat Ferry)', hasRopeway: false, hasBoat: true }
  ],
  tmp_ambaji: [
    { id: 'post_amb_1', name: 'Shakti Dwar Central Main Entrance', hasRopeway: false, hasBoat: false },
    { id: 'post_amb_2', name: 'Shakti Dwar Gate 7 Priority Lane', hasRopeway: false, hasBoat: false },
    { id: 'post_amb_3', name: 'Chachar Chowk Main Courtyard', hasRopeway: false, hasBoat: false },
    { id: 'post_amb_4', name: 'Gabbar Hill Cable Car Ropeway Base', hasRopeway: true, hasBoat: false }
  ],
  tmp_pavagadh: [
    { id: 'post_pav_1', name: 'Machi Base Ropeway Boarding Station', hasRopeway: true, hasBoat: false },
    { id: 'post_pav_2', name: 'Champaner Heritage Gate (P2 Parking)', hasRopeway: false, hasBoat: false },
    { id: 'post_pav_3', name: 'Trekking Staircase Entrance (~1800 Steps)', hasRopeway: false, hasBoat: false },
    { id: 'post_pav_4', name: 'Hilltop Kalika Mata Shikhara Queue', hasRopeway: false, hasBoat: false }
  ]
};
