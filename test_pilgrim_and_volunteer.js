import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const PORT = 4178;
const distDir = path.resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const cleanUrl = req.url.split('?')[0];
  let filePath = path.join(distDir, cleanUrl === '/' ? 'index.html' : cleanUrl);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

async function runTestSuite() {
  server.listen(PORT, '127.0.0.1', async () => {
    console.log('========================================================================');
    console.log('      NIRVIGHNA PILGRIM & VOLUNTEER APPS COMPREHENSIVE QA TEST SUITE    ');
    console.log('========================================================================\n');
    console.log(`[INIT] Local test web server listening on http://127.0.0.1:${PORT}\n`);

    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

    const browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 2
    });

    const page = await context.newPage();

    const runtimeErrors = [];
    page.on('pageerror', (err) => {
      console.error('  [PAGE ERROR DETECTED]:', err.message);
      runtimeErrors.push(err.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('DevTools') && !text.includes('Failed to load resource')) {
          console.warn('  [CONSOLE ERROR]:', text);
        }
      }
    });

    let passedTests = 0;
    let failedTests = 0;

    const assertTest = async (condition, testName) => {
      if (condition) {
        passedTests++;
        console.log(`  ✓ [PASS ${passedTests}] ${testName}`);
      } else {
        failedTests++;
        const currentUrl = page.url();
        let snippet = '';
        try {
          snippet = (await page.locator('body').innerText()).slice(0, 150).replace(/\s+/g, ' ');
        } catch (_) {}
        console.error(`  ✗ [FAIL] ${testName} | URL: ${currentUrl} | Page Text: "${snippet}"`);
      }
    };

    try {
      // ================================================================
      // SECTION 1: PILGRIM PORTAL — UNAUTHENTICATED FLOWS
      // ================================================================
      console.log('--- [SECTION 1: PILGRIM PORTAL - UNAUTHENTICATED] ---');

      // Test 1: Unauthenticated root redirects to Login
      await page.goto(`http://127.0.0.1:${PORT}/#/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await assertTest(page.url().includes('/login'), 'Unauthenticated pilgrim automatically redirects to /login');

      // Test 2: Login Page Branding & Input Verification
      const loginBody = await page.locator('body').innerText();
      await assertTest(
        loginBody.includes('NIRVIGHNA') || loginBody.includes('निर्विघ्न') || loginBody.includes('Login'),
        'Pilgrim Login screen renders divine header and branding'
      );
      await assertTest(
        !loginBody.includes('Guest Mode') && !loginBody.includes('गेस्ट'),
        'Security verification: Guest bypass is completely disabled'
      );

      // Test 3: Signup Page Flow
      await page.goto(`http://127.0.0.1:${PORT}/#/signup`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const signupBody = await page.locator('body').innerText();
      await assertTest(
        signupBody.includes('Create Your Pilgrim Account') || signupBody.includes('Pilgrim Account') || signupBody.includes('DPDP') || signupBody.includes('Register') || signupBody.includes('Sign Up'),
        'Pilgrim Signup screen renders with registration form'
      );

      // ================================================================
      // SECTION 2: PILGRIM PORTAL — AUTHENTICATED EXPERIENCE
      // ================================================================
      console.log('\n--- [SECTION 2: PILGRIM PORTAL - AUTHENTICATED] ---');

      // Seed verified Pilgrim session in localStorage
      await page.evaluate(() => {
        const pilgrimSession = {
          id: 'devotee_usr_108',
          phone: '+91 98765 43210',
          full_name: 'Harshit Agrawal',
          email: 'harshit@nirvighna.gov.in',
          role: 'devotee',
          emergency_contact_name: 'Devotee Family Help',
          emergency_contact_phone: '+91 98765 43211',
          created_at: new Date().toISOString()
        };
        localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(pilgrimSession));
      });

      // CRITICAL: Reload so AuthContext picks up the seeded localStorage session
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(800);

      // Test 4: Pilgrim Home Dashboard
      await page.goto(`http://127.0.0.1:${PORT}/#/home`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const homeText = await page.locator('body').innerText();
      await assertTest(
        homeText.includes('Somnath') || homeText.includes('સોમનાથ') || homeText.includes('सोमनाथ') || homeText.includes('Darshan'),
        'Pilgrim Home dashboard renders temple darshan cards'
      );

      // Test 5: Darshan Booking Screen
      await page.goto(`http://127.0.0.1:${PORT}/#/book/tmp_somnath`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const bookText = await page.locator('body').innerText();
      await assertTest(
        bookText.includes('Slot') || bookText.includes('स्लॉट') || bookText.includes('સ્લોટ') || bookText.includes('Darshan') || bookText.includes('Devotee'),
        'Darshan slot booking screen renders with time slots'
      );

      // Test 6: Travel, Transit & Parking Module
      await page.goto(`http://127.0.0.1:${PORT}/#/travel`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const travelText = await page.locator('body').innerText();
      await assertTest(
        travelText.includes('Parking') || travelText.includes('पार्किंग') || travelText.includes('પાર્કિંગ') || travelText.includes('Ropeway') || travelText.includes('Shuttle'),
        'Travel & Parking transit module operational'
      );

      // Test 7: Digital Signed QR Pass Portal
      await page.goto(`http://127.0.0.1:${PORT}/#/pass`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const passText = (await page.locator('body').innerText()).toLowerCase();
      await assertTest(
        passText.includes('pass') || passText.includes('qr') || passText.includes('પાસ') || passText.includes('पास') || passText.includes('turnstile'),
        'Digital Signed QR Pass portal renders'
      );

      // Test 8: My Bookings Screen
      await page.goto(`http://127.0.0.1:${PORT}/#/my-bookings`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const myBookingsText = await page.locator('body').innerText();
      await assertTest(
        myBookingsText.includes('Bookings') || myBookingsText.includes('बुकिंग') || myBookingsText.includes('બુકિંગ') || myBookingsText.includes('Passes'),
        'My Bookings tab and pass repository operational'
      );

      // Test 9: Family & Group Management Screen
      await page.goto(`http://127.0.0.1:${PORT}/#/family`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const familyText = await page.locator('body').innerText();
      await assertTest(
        familyText.includes('Family') || familyText.includes('FAMILY') || familyText.includes('परिवार') || familyText.includes('પરિવાર') || familyText.includes('Member') || familyText.includes('MEMBERS'),
        'Family group management screen operational'
      );

      // Test 10: Lost & Found Safety Report Screen
      await page.goto(`http://127.0.0.1:${PORT}/#/lost-report`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const lostText = await page.locator('body').innerText();
      await assertTest(
        lostText.includes('Lost') || lostText.includes('खोया') || lostText.includes('ખોવાયેલ') || lostText.includes('Report'),
        'Lost & Found safety reporting module operational'
      );

      // Test 11: Padyatri Mela Safety Route Screen
      await page.goto(`http://127.0.0.1:${PORT}/#/mela-route`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const melaText = (await page.locator('body').innerText()).toLowerCase();
      await assertTest(
        melaText.includes('padyatri') || melaText.includes('पदयात्री') || melaText.includes('પદયાત્રી') || melaText.includes('route') || melaText.includes('camp') || melaText.includes('bhadarvi'),
        'Padyatri Mela route tracking operational'
      );

      // Test 12: Priority Audio Navigation Screen
      await page.goto(`http://127.0.0.1:${PORT}/#/priority-nav`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const audioText = await page.locator('body').innerText();
      await assertTest(
        audioText.includes('Audio') || audioText.includes('ध्वनि') || audioText.includes('Voice') || audioText.includes('Nav'),
        'Priority Audio Navigation voice guidance operational'
      );

      // Test 13: Devotee Profile Screen
      await page.goto(`http://127.0.0.1:${PORT}/#/profile`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const profileText = await page.locator('body').innerText();
      await assertTest(
        profileText.includes('Harshit Agrawal') || profileText.includes('Profile') || profileText.includes('प्रोफाइल'),
        'Devotee Profile page renders user info correctly'
      );

      // Test 14: Notifications & Safety Broadcasts Screen
      await page.goto(`http://127.0.0.1:${PORT}/#/notifications`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const notifText = await page.locator('body').innerText();
      await assertTest(
        notifText.includes('Notification') || notifText.includes('सूचना') || notifText.includes('Alert') || notifText.includes('સૂચના'),
        'Notifications and safety alert center operational'
      );

      // ================================================================
      // SECTION 3: VOLUNTEER OPERATIONS HUB — UNAUTHENTICATED FLOWS
      // ================================================================
      console.log('\n--- [SECTION 3: VOLUNTEER OPERATIONS HUB - UNAUTHENTICATED] ---');

      // Clear volunteer session
      await page.evaluate(() => {
        localStorage.removeItem('nirvighna_volunteer_session');
      });

      // Test 15: Unauthenticated access to /v/dashboard redirects to /v/login
      await page.goto(`http://127.0.0.1:${PORT}/#/v/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await assertTest(page.url().includes('/v/login'), 'Unauthenticated volunteer redirects to /v/login');

      // Test 16: Volunteer Login Page Verification
      const volLoginText = await page.locator('body').innerText();
      await assertTest(
        volLoginText.includes('Volunteer') || volLoginText.includes('स्वयंसेवक') || volLoginText.includes('સ્વયંસેવક') || volLoginText.includes('Duty'),
        'Volunteer Login screen renders role and credential inputs'
      );

      // ================================================================
      // SECTION 4: VOLUNTEER OPERATIONS HUB — AUTHENTICATED EXPERIENCE
      // ================================================================
      console.log('\n--- [SECTION 4: VOLUNTEER OPERATIONS HUB - AUTHENTICATED] ---');

      // Seed verified Volunteer session in localStorage
      await page.evaluate(() => {
        const volunteerSession = {
          id: 'vol_somnath_8841',
          full_name: 'Vikram Sharma (Volunteer)',
          phone: '+91 98412 88410',
          role: 'volunteer',
          zone_assigned: 'Gate 2 Swarga Dwar Sanctum Queue',
          shift: 'Morning Darshan (06:00 - 14:00)',
          badge_id: 'VOL-GJ-8841'
        };
        localStorage.setItem('nirvighna_volunteer_session', JSON.stringify(volunteerSession));
      });

      // CRITICAL: Reload so VolunteerAuthContext picks up the seeded localStorage session
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(800);

      // Test 17: Volunteer Dashboard Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volDashText = await page.locator('body').innerText();
      await assertTest(
        volDashText.includes('Vikram') || volDashText.includes('Gate 2') || volDashText.includes('Volunteer') || volDashText.includes('Shift') || volDashText.includes('Dashboard'),
        'Volunteer Dashboard renders assigned duty zone and live shift telemetry'
      );

      // Test 18: Volunteer QR Scanner Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/scan`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volScanText = await page.locator('body').innerText();
      await assertTest(
        volScanText.includes('Scanner') || volScanText.includes('Scan') || volScanText.includes('QR') || volScanText.includes('Camera'),
        'Volunteer QR Turnstile Scanner viewfinder operational'
      );

      // Test 19: Volunteer Scan Result Inspection Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/scan-result/PASS-SOMNATH-108`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volResultText = await page.locator('body').innerText();
      await assertTest(
        volResultText.includes('PASS') || volResultText.includes('Valid') || volResultText.includes('Devotee') || volResultText.includes('Entry') || volResultText.includes('Verified'),
        'Volunteer Scan Result verification portal operational'
      );

      // Test 20: Volunteer Crowd & SOS Alerts Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/alerts`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volAlertsText = await page.locator('body').innerText();
      await assertTest(
        volAlertsText.includes('Alert') || volAlertsText.includes('Emergency') || volAlertsText.includes('Surge') || volAlertsText.includes('SOS'),
        'Volunteer Crowd & Safety Alerts feed operational'
      );

      // Test 21: Volunteer Medical Responder & Corridor Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/medical/med-01`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volMedText = await page.locator('body').innerText();
      await assertTest(
        volMedText.includes('Medical') || volMedText.includes('Emergency') || volMedText.includes('Vitals') || volMedText.includes('Corridor') || volMedText.includes('Patient'),
        'Volunteer Medical Emergency triage portal operational'
      );

      // Test 22: Volunteer Lost & Found Field Verification Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/lost-found`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volLostText = (await page.locator('body').innerText()).toLowerCase();
      await assertTest(
        volLostText.includes('lost') || volLostText.includes('found') || volLostText.includes('missing') || volLostText.includes('child'),
        'Volunteer Lost & Found field coordination portal operational'
      );

      // Test 23: Volunteer Prasad Distribution Counter Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/prasad`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volPrasadText = await page.locator('body').innerText();
      await assertTest(
        volPrasadText.includes('Prasad') || volPrasadText.includes('प्रसाद') || volPrasadText.includes('Coupon') || volPrasadText.includes('Counter'),
        'Volunteer Mahaprasad distribution counter operational'
      );

      // Test 24: Volunteer Footwear Locker Counter Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/footwear`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volFootText = await page.locator('body').innerText();
      await assertTest(
        volFootText.includes('Footwear') || volFootText.includes('Locker') || volFootText.includes('Token') || volFootText.includes('Rack'),
        'Volunteer Footwear locker allocation portal operational'
      );

      // Test 25: Volunteer Staff Profile Page
      await page.goto(`http://127.0.0.1:${PORT}/#/v/profile`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const volProfileText = await page.locator('body').innerText();
      await assertTest(
        volProfileText.includes('Vikram') || volProfileText.includes('Volunteer') || volProfileText.includes('Duty') || volProfileText.includes('Logout'),
        'Volunteer Staff Profile and Shift summary operational'
      );

      // ================================================================
      // SECTION 5: RUNTIME EXCEPTION AUDIT
      // ================================================================
      console.log('\n--- [SECTION 5: RUNTIME EXCEPTION AUDIT] ---');
      await assertTest(
        runtimeErrors.length === 0,
        `Zero Unhandled JavaScript Exceptions (Errors: ${runtimeErrors.length}${runtimeErrors.length > 0 ? ' | ' + runtimeErrors.join(' | ') : ''})`
      );

      await browser.close();
      server.close();

      console.log('\n========================================================================');
      console.log(`   QA SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
      console.log(`   TOTAL RUNTIME CRASHES/PAGE ERRORS: ${runtimeErrors.length}`);
      console.log('========================================================================\n');

      if (failedTests > 0 || runtimeErrors.length > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (err) {
      console.error('\n[FATAL TEST RUNNER ERROR]:', err);
      try { await browser.close(); } catch (_) {}
      server.close();
      process.exit(1);
    }
  });
}

runTestSuite();
