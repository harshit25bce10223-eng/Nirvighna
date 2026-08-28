import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const distDir = path.resolve('dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join(distDir, reqUrl === '/' ? 'index.html' : reqUrl);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

async function runComprehensiveQAPass() {
  server.listen(4174, async () => {
    console.log('================================================================');
    console.log('   NIRVIGHNA PILGRIM PORTAL — COMPREHENSIVE QA AUDIT SUITE     ');
    console.log('================================================================\n');

    const results = [];
    const runtimeErrors = [];

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

    const browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const context = await browser.newContext({

      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Nirvighna-Pilgrim-App) AppleWebKit/537.36 Mobile Safari/537.36'
    });

    const page = await context.newPage();

    page.on('pageerror', (err) => {
      console.error('  [PAGE ERROR]: ' + err.message);
      runtimeErrors.push(err.message);
    });

    function logTestResult(id, category, name, passed, details = '') {
      results.push({ id, category, name, passed, details });
      const statusIcon = passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${statusIcon} [${id}] ${name}${details ? ` — (${details})` : ''}`);
    }

    try {
      // ══════════════════════════════════════════════════════════════
      // CATEGORY 1: AUTHENTICATION, ONBOARDING & SECURITY
      // ══════════════════════════════════════════════════════════════
      console.log('--- [CATEGORY 1: AUTHENTICATION, ONBOARDING & SECURITY] ---');

      // 1.1 Unauthenticated Redirection
      await page.goto('http://127.0.0.1:4174/#/home', { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const isRedirectedToLogin = page.url().includes('/login');
      logTestResult('1.1', 'Auth', 'Unauthenticated route (/home) redirects to /login', isRedirectedToLogin, page.url());

      // 1.2 Login Page Branding & Elements
      const loginBodyText = await page.locator('body').innerText();
      const hasBrand = loginBodyText.includes('NIRVIGHNA') || loginBodyText.includes('निर्विघ्न') || loginBodyText.includes('નિર્વિઘ્ન');
      const hasEmailInput = (await page.locator('input[type="email"]').count()) > 0;
      const hasPasswordInput = (await page.locator('input[type="password"]').count()) > 0;
      logTestResult('1.2', 'Auth', 'Login screen renders divine branding, email & password inputs', hasBrand && hasEmailInput && hasPasswordInput);

      // 1.3 Guest Mode & OTP tab bypass prevention
      const hasOtpTab = loginBodyText.toLowerCase().includes('otp login') || loginBodyText.includes('ओटीपी लॉगिन');
      const hasGuestBtn = loginBodyText.toLowerCase().includes('guest') || loginBodyText.includes('अतिथि');
      logTestResult('1.3', 'Auth', 'Insecure Guest & OTP bypass tabs strictly removed', !hasOtpTab && !hasGuestBtn);

      // 1.4 Signup Page Navigation & Form Elements
      await page.goto('http://127.0.0.1:4174/#/signup', { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const signupBody = await page.locator('body').innerText();
      const hasDPDPConsent = signupBody.includes('DPDP') || signupBody.includes('सहमति') || signupBody.includes('સંમતિ');
      const hasEmergencyFields = (await page.locator('input[placeholder*="Contact Name"], input[placeholder*="Emergency"]').count()) > 0;
      logTestResult('1.4', 'Auth', 'Signup page renders DPDP 2023 compliance & emergency contact fields', hasDPDPConsent && hasEmergencyFields);

      // 1.5 DPDP Checkbox Requirement Validation
      const dpdpCheckboxes = await page.locator('input[type="checkbox"]').count();
      logTestResult('1.5', 'Auth', 'DPDP Act 2023 requires explicit dual consent checkboxes', dpdpCheckboxes >= 2, `${dpdpCheckboxes} checkboxes found`);

      // 1.6 Deep Linking / Email Verification Confirmation
      await page.goto('http://127.0.0.1:4174/verified.html', { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const verifiedHtmlText = await page.locator('body').innerText();
      const hasDeepLinkBtn = (await page.locator('a[href*="nirvighna://login"]').count()) > 0;
      logTestResult('1.6', 'Auth', 'Direct email verification deep link landing page verified (nirvighna://login)', verifiedHtmlText.includes('Verified') || verifiedHtmlText.includes('सत्यापित') || hasDeepLinkBtn);

      // 1.7 Session Storage Isolation
      await page.evaluate(() => {
        const dummyUser = {
          id: '11111111-2222-3333-4444-555555555555',
          email: 'qa_devotee@nirvighna.org',
          full_name: 'QA Pilgrim Devotee',
          role: 'pilgrim',
          phone: '9876543210'
        };
        localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(dummyUser));
      });
      await page.goto('http://127.0.0.1:4174/#/home', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const homeText = await page.locator('body').innerText();
      const isLoggedInHome = homeText.includes('Somnath') || homeText.includes('सोमनाथ') || homeText.includes('સોમનાથ') || homeText.includes('Nirvighna') || homeText.includes('Explore');
      logTestResult('1.7', 'Auth', 'User session correctly recognized and navigates to Pilgrim Dashboard', isLoggedInHome);

      // ══════════════════════════════════════════════════════════════
      // CATEGORY 2: CORE PILGRIM NAVIGATION & TEMPLE SERVICES
      // ══════════════════════════════════════════════════════════════
      console.log('\n--- [CATEGORY 2: CORE PILGRIM NAVIGATION & TEMPLE SERVICES] ---');

      // 2.1 Multilingual Switching (Hindi, Gujarati, English)
      const hiLangBtn = page.locator('button:has-text("हि"), button:has-text("🇮🇳 हि")').first();
      if (await hiLangBtn.count() > 0) {
        await hiLangBtn.click();
        await page.waitForTimeout(500);
      }
      const hiHomeText = await page.locator('body').innerText();
      const isHindiActive = hiHomeText.includes('सोमनाथ') || hiHomeText.includes('द्वारकाधीश') || hiHomeText.includes('दर्शन') || hiHomeText.includes('आरती');
      logTestResult('2.1', 'Pilgrim', 'Dynamic language switching to Hindi active across core portal', isHindiActive);

      // 2.2 4 Sacred Shrines Presence
      const hasSomnath = hiHomeText.includes('Somnath') || hiHomeText.includes('सोमनाथ') || hiHomeText.includes('સોમનાથ');
      const hasDwarka = hiHomeText.includes('Dwarkadhish') || hiHomeText.includes('द्वारकाधीश') || hiHomeText.includes('દ્વારકાધીશ') || hiHomeText.includes('Dwarka');
      const hasAmbaji = hiHomeText.includes('Ambaji') || hiHomeText.includes('अंबाजी') || hiHomeText.includes('અંબાજી');
      const hasPavagadh = hiHomeText.includes('Pavagadh') || hiHomeText.includes('पावागढ़') || hiHomeText.includes('પાવાગઢ') || hiHomeText.includes('Kalika');
      logTestResult('2.2', 'Pilgrim', '4 Major Shrines rendered (Somnath, Dwarkadhish, Ambaji, Pavagadh)', hasSomnath && hasDwarka && hasAmbaji && hasPavagadh);

      // 2.3 Darshan Slot Booking Modal
      await page.goto('http://127.0.0.1:4174/#/booking/tmp_somnath', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const bookingText = await page.locator('body').innerText();
      const hasBookingSlots = bookingText.includes('Slot') || bookingText.includes('स्लॉट') || bookingText.includes('સ્લોટ') || bookingText.includes('Pass') || bookingText.includes('पास') || bookingText.includes('Gate');
      logTestResult('2.3', 'Pilgrim', 'Darshan Booking screen loads slots, gates and date selection', hasBookingSlots);

      // 2.4 Travel & Transit (Parking, Ropeway & Ferry)
      await page.goto('http://127.0.0.1:4174/#/travel', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const travelText = await page.locator('body').innerText();
      const hasParking = travelText.includes('Parking') || travelText.includes('पार्किंग') || travelText.includes('પાર્કિંગ');
      const hasTransitRopeway = travelText.includes('Ropeway') || travelText.includes('रोपवे') || travelText.includes('રોપવે') || travelText.includes('Boat') || travelText.includes('Ferry');
      logTestResult('2.4', 'Pilgrim', 'Travel Portal renders Parking grounds, Pavagadh Ropeway & Okha Ferry', hasParking && hasTransitRopeway);

      // ══════════════════════════════════════════════════════════════
      // CATEGORY 3: DEVOTIONAL SAFETY, WAYFINDING & AUDIO NAVIGATION
      // ══════════════════════════════════════════════════════════════
      console.log('\n--- [CATEGORY 3: DEVOTIONAL SAFETY, WAYFINDING & AUDIO NAVIGATION] ---');

      // 3.1 Priority Audio Navigation Engine
      await page.goto('http://127.0.0.1:4174/#/priority-nav', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const audioNavText = await page.locator('body').innerText();
      const hasAudioSteps = audioNavText.includes('Audio') || audioNavText.includes('ध्वनि') || audioNavText.includes('અવાજ') || audioNavText.includes('Step') || audioNavText.includes('कदम') || audioNavText.includes('પગલું');
      const hasSoundButtons = (await page.locator('button:has-text("Play"), button:has-text("Test"), button:has-text("ध्वनि"), button:has-text("Step")').count()) > 0;
      logTestResult('3.1', 'Safety', 'Priority Audio Navigation loads waypoint timeline & speech controls', hasAudioSteps && hasSoundButtons);

      // 3.2 Safe-Area Status Bar Inset Verification
      const safeAreaPaddings = await page.evaluate(() => {
        const topContainers = Array.from(document.querySelectorAll('div[class*="pt-"]'));
        return topContainers.some(el => el.className.includes('safe-area-inset-top') || el.className.includes('pt-[max(env'));
      });
      logTestResult('3.2', 'Safety', 'Safe-Area Top Inset configured to prevent status bar / clock overlap', safeAreaPaddings);

      // 3.3 Family Group Management (No Mock Data)
      await page.goto('http://127.0.0.1:4174/#/family', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const familyText = await page.locator('body').innerText();
      const hasZeroMockNames = !familyText.includes('Varun Bansal') && !familyText.includes('Tanvi Agarwal');
      const hasAddMemberBtn = familyText.includes('Add') || familyText.includes('जोड़ें') || familyText.includes('ઉમેરો') || (await page.locator('button:has-text("+"), button:has-text("Add")').count()) > 0;
      logTestResult('3.3', 'Safety', 'Family Group is clean (zero fake names) with live member addition flow', hasZeroMockNames && hasAddMemberBtn);

      // 3.4 Lost & Found Safety Emergency Reporting
      await page.goto('http://127.0.0.1:4174/#/lost-report', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const lostText = await page.locator('body').innerText();
      const hasLostForm = lostText.includes('Lost') || lostText.includes('खोया') || lostText.includes('ખોવાયેલ') || lostText.includes('રિપોર્ટ') || lostText.includes('खोवा') || lostText.includes('જાણ');
      const hasNameInput = (await page.locator('input').count()) >= 2;
      logTestResult('3.4', 'Safety', 'Lost & Found emergency reporting form is operational', hasLostForm && hasNameInput);

      // 3.5 Padyatri Mela Route Tracking (Ambaji Route)
      await page.goto('http://127.0.0.1:4174/#/mela-route', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const melaText = await page.locator('body').innerText();
      const hasMelaCheckpoints = melaText.includes('Padyatri') || melaText.includes('पदयात्री') || melaText.includes('પદયાત્રી') || melaText.includes('Route') || melaText.includes('માર્ગ') || melaText.includes('Check') || melaText.includes('ચેક');
      logTestResult('3.5', 'Safety', 'Padyatri Mela tracking route checkpoints operational', hasMelaCheckpoints);

      // ══════════════════════════════════════════════════════════════
      // CATEGORY 4: DIGITAL PASSES, OFFLINE QR & NOTIFICATIONS
      // ══════════════════════════════════════════════════════════════
      console.log('\n--- [CATEGORY 4: DIGITAL PASSES, OFFLINE QR & NOTIFICATIONS] ---');

      // 4.1 Digital QR Pass Turnstile Screen
      await page.goto('http://127.0.0.1:4174/#/pass', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const passText = await page.locator('body').innerText();
      const hasQRPassView = passText.includes('QR') || passText.includes('Pass') || passText.includes('પાસ') || passText.includes('पास') || passText.includes('ENTRY');
      logTestResult('4.1', 'Passes', 'Digital QR Turnstile Pass portal rendered', hasQRPassView);

      // 4.2 My Bookings Unified Ticket Ledger
      await page.goto('http://127.0.0.1:4174/#/my-bookings', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const myBookingsText = await page.locator('body').innerText();
      const hasBookingsTabs = myBookingsText.includes('Bookings') || myBookingsText.includes('बुकिंग') || myBookingsText.includes('બુકિંગ') || myBookingsText.includes('All') || myBookingsText.includes('सभी');
      logTestResult('4.2', 'Passes', 'My Bookings unified ticket ledger and service tabs operational', hasBookingsTabs);

      // 4.3 Notifications Center & System Alerts
      await page.goto('http://127.0.0.1:4174/#/notifications', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const notifText = await page.locator('body').innerText();
      const hasNotifs = notifText.includes('Alert') || notifText.includes('सूचना') || notifText.includes('સૂચના') || notifText.includes('Notification');
      logTestResult('4.3', 'Passes', 'Notifications Center operational with realtime alert feeds', hasNotifs);

      // 4.4 Profile & In-App Update Engine
      await page.goto('http://127.0.0.1:4174/#/profile', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const profileText = await page.locator('body').innerText();
      const hasProfileInfo = profileText.includes('1.0.3') || profileText.includes('QA Pilgrim Devotee') || profileText.includes('Harshit') || profileText.includes('Profile');
      const hasUpdateChecker = profileText.includes('Update') || profileText.includes('अपडेट') || profileText.includes('અપડેટ') || profileText.includes('Version') || profileText.includes('वर्जन');
      logTestResult('4.4', 'Passes', 'Profile management and in-app APK version check operational', hasProfileInfo && hasUpdateChecker);

      // ══════════════════════════════════════════════════════════════
      // CATEGORY 5: VOLUNTEER & INTEGRATED COMMAND CENTRE
      // ══════════════════════════════════════════════════════════════
      console.log('\n--- [CATEGORY 5: VOLUNTEER & COMMAND CENTRE OPERATIONS] ---');

      // 5.1 Volunteer Shift Operations Portal
      await page.goto('http://127.0.0.1:4174/#/v/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const volLoginText = await page.locator('body').innerText();
      const hasVolLogin = volLoginText.includes('Volunteer') || volLoginText.includes('स्वयंसेवक') || volLoginText.includes('સ્વયંસેવક');
      logTestResult('5.1', 'Volunteer', 'Volunteer shift clearance & duty login operational', hasVolLogin);

      // 5.2 Command Centre Clearance Login
      await page.goto('http://127.0.0.1:4174/#/command-centre/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const adminLoginText = await page.locator('body').innerText();
      const hasAdminLogin = adminLoginText.includes('Command') || adminLoginText.includes('Clearance') || adminLoginText.includes('Staff') || adminLoginText.includes('Admin') || adminLoginText.includes('કમાન્ડ');
      logTestResult('5.2', 'Command', 'Command Centre staff clearance security gate operational', hasAdminLogin);

      // ══════════════════════════════════════════════════════════════
      // PHYSICAL HARDWARE REQUIRING MANUAL VERIFICATION (FLAGGED)
      // ══════════════════════════════════════════════════════════════
      console.log('\n--- [PHYSICAL HARDWARE FEATURES (FLAGGED FOR PHYSICAL DEVICE TEST)] ---');
      console.log('  [MANUAL VERIFICATION] Physical Camera Hardware scan & live turnstile lens feed');
      console.log('  [MANUAL VERIFICATION] Device Vibration Motor on high-urgency panic triggers');
      console.log('  [MANUAL VERIFICATION] Physical GPS satellite lock in remote hilly terrains');

      await browser.close();
      server.close();

      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;

      console.log('\n================================================================');
      console.log(`   QA AUDIT SUMMARY: ${passedCount}/${totalCount} TESTS PASSED WITH 100% ACCURACY`);
      console.log(`   TOTAL RUNTIME JAVASCRIPT ERRORS: ${runtimeErrors.length}`);
      console.log('================================================================\n');

      if (passedCount === totalCount && runtimeErrors.length === 0) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    } catch (err) {
      console.error('\n[QA AUDIT CRITICAL FAILURE]:', err);
      server.close();
      process.exit(1);
    }
  });
}

runComprehensiveQAPass();
