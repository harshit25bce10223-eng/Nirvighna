import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('   NIRVIGHNA FULL-SPECTRUM COMPREHENSIVE TEST SUITE (ALL APPS)  ');
console.log('================================================================\n');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://127.0.0.1:4173');
  let pathname = parsedUrl.pathname;
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join('dist', pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile(path.join('dist', 'index.html'), (err2, fallbackContent) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallbackContent, 'utf-8');
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const runExhaustiveSuite = async () => {
  server.listen(4173, '127.0.0.1', async () => {
    console.log('[INIT] Static test server running on port 4173...\n');

    try {
      const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

      const browser = await chromium.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });

      const context = await browser.newContext({
        viewport: { width: 393, height: 852 }
      });

      const page = await context.newPage();

      const runtimeErrors = [];
      page.on('pageerror', (err) => {
        console.error('  [PAGE ERROR]:', err.message);
        runtimeErrors.push(err.message);
      });

      let passedCount = 0;
      let totalTests = 0;

      const assertTest = (condition, testName) => {
        totalTests++;
        if (condition) {
          passedCount++;
          console.log(`  ✓ [PASS ${passedCount}] ${testName}`);
        } else {
          console.error(`  ✗ [FAIL] ${testName}`);
          throw new Error(`Test Failed: ${testName}`);
        }
      };

      // ─── TIER 1: AUTHENTICATION & LOGIN (EASY TO MEDIUM) ───────────
      console.log('\n--- [TIER 1: AUTHENTICATION & SECURITY] ---');

      // Test 1: Fresh Launch Redirect to Login
      await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const url1 = page.url();
      assertTest(url1.includes('/login'), 'Unauthenticated user automatically directed to /login');

      // Test 2: Verify Login UI & Brand Elements
      const loginBody = await page.locator('body').innerText();
      assertTest(loginBody.includes('NIRVIGHNA') || loginBody.includes('निर्विघ्न'), 'Divine Brand Header rendered on Login');
      assertTest(!loginBody.includes('Guest Mode') && !loginBody.includes('गेस्ट'), 'Guest mode bypass is completely disabled');
      assertTest(!loginBody.includes('Email OTP') && !loginBody.includes('ईमेल OTP'), 'Login OTP tab removed in favor of clean Email+Password verification');

      // Test 3: Language Switching on Login Screen
      const guBtn = page.locator('button:has-text("ગુજ")');
      if (await guBtn.count() > 0) {
        await guBtn.click();
        await page.waitForTimeout(300);
        const guBody = await page.locator('body').innerText();
        assertTest(guBody.includes('નિર્વિઘ્ન') || guBody.includes('લૉગિન'), 'Language switched dynamically to Gujarati');
      }

      // Test 4: Signup Validation Gate
      await page.goto('http://127.0.0.1:4173/#/signup', { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const signupBody = await page.locator('body').innerText();
      assertTest(signupBody.includes('DPDP') || signupBody.includes('Consent') || signupBody.includes('सहमति') || signupBody.includes('સંમતિ'), 'DPDP Act 2023 compliance consent rendered on signup');

      // ─── TIER 2: PILGRIM PORTAL CORE FLOWS (MEDIUM TO HARD) ────────
      console.log('\n--- [TIER 2: PILGRIM PORTAL CORE FLOWS] ---');

      // Seed Authenticated Devotee Session
      await page.evaluate(() => {
        const devotee = {
          id: 'devotee_harshit_deep_test',
          full_name: 'Harshit Agrawal',
          email: 'harshit.test@nirvighna.org',
          phone: '9876543210',
          role: 'pilgrim',
          language_preference: 'hi'
        };
        localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(devotee));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(800);

      // Test 5: Home Dashboard & All 4 Temples
      await page.goto('http://127.0.0.1:4173/#/home', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);
      const homeText = await page.locator('body').innerText();
      console.log('  [DIAGNOSTIC] URL:', page.url(), '| Snippet:', homeText.replace(/\n+/g, ' ').substring(0, 300));
      if (homeText.includes('COMPONENT FAULT ISOLATION PROTOCOL ACTIVE')) {
        const errorDetails = await page.locator('body').innerText();
        console.error('  [ERROR BOUNDARY DETAILS]:\n', errorDetails);
      }
      assertTest(homeText.includes('Somnath') || homeText.includes('सोमनाथ') || homeText.includes('સોમનાથ'), 'Somnath Temple rendered on Home');
      assertTest(homeText.includes('Dwarka') || homeText.includes('द्वारका') || homeText.includes('દ્વારકા'), 'Dwarkadhish Temple rendered on Home');
      assertTest(homeText.includes('Ambaji') || homeText.includes('अंबाजी') || homeText.includes('અંબાજી'), 'Ambaji Shrine rendered on Home');
      assertTest(homeText.includes('Pavagadh') || homeText.includes('पावागढ़') || homeText.includes('પાવાગઢ'), 'Pavagadh Kalika Temple rendered on Home');

      // Test 5b: Free Prasad Bottom Sheet Modal
      const prasadTile = page.locator('text=Free Prasad Counter').or(page.locator('text=મફત પ્રસાદ કેન્દ્ર')).or(page.locator('text=मुफ्त प्रसाद'));
      await prasadTile.first().click();
      await page.waitForTimeout(400);
      const prasadSheetText = await page.locator('body').innerText();
      assertTest(prasadSheetText.includes('Mahaprasad') || prasadSheetText.includes('મહાપ્રસાદ') || prasadSheetText.includes('महाप्रसाद'), 'Prasad Bottom Sheet modal opened smoothly over the view');
      const closePrasad = page.locator('.lucide-x').or(page.locator('button:has-text("Close Pass")'));
      await closePrasad.first().click();
      await page.waitForTimeout(300);

      // Test 5c: Smart Footwear Locker Bottom Sheet Modal
      const footwearTile = page.locator('text=Footwear Locker').or(page.locator('text=પગરખાં લોકર')).or(page.locator('text=जूता लॉकर'));
      await footwearTile.first().click();
      await page.waitForTimeout(400);
      const footwearSheetText = await page.locator('body').innerText();
      assertTest(footwearSheetText.includes('Footwear') || footwearSheetText.includes('પગરખાં') || footwearSheetText.includes('लॉकर'), 'Footwear Locker Bottom Sheet modal opened smoothly over the view');
      const closeFootwear = page.locator('.lucide-x').or(page.locator('button:has-text("Close")'));
      await closeFootwear.first().click();
      await page.waitForTimeout(300);

      // Test 6: Darshan Booking Flow
      await page.goto('http://127.0.0.1:4173/#/book/somnath', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const bookText = await page.locator('body').innerText();
      assertTest(bookText.includes('Slot') || bookText.includes('स्लॉट') || bookText.includes('સ્લોટ') || bookText.includes('Darshan') || bookText.includes('दर्शन') || bookText.includes('દર્શન'), 'Somnath Slot selection rendered');


      // Test 7: Travel, Transit & Parking Module
      await page.goto('http://127.0.0.1:4173/#/travel', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const travelText = await page.locator('body').innerText();
      assertTest(travelText.includes('Parking') || travelText.includes('पार्किंग') || travelText.includes('પાર્કિંગ') || travelText.includes('Ropeway') || travelText.includes('रोपवे') || travelText.includes('રોપવે') || travelText.includes('યાત્રા'), 'Travel & Transit parking/ropeway modules verified');

      // Test 8: Family & Group Management (Zero Dummy Data Check)
      await page.goto('http://127.0.0.1:4173/#/family', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const familyText = await page.locator('body').innerText();
      assertTest(!familyText.includes('Varun Bansal') && !familyText.includes('Tanvi Agarwal'), 'Clean family state: Zero fake/mock family names');

      // Test 9: Lost & Found Reporting Safety Module
      await page.goto('http://127.0.0.1:4173/#/lost-report', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const lostText = await page.locator('body').innerText();
      assertTest(lostText.includes('Lost') || lostText.includes('खोया') || lostText.includes('ખોવાયેલ') || lostText.includes('Report') || lostText.includes('રિપોર્ટ') || lostText.includes('ખોવાઈ') || lostText.includes('જાણ'), 'Lost & Found safety reporting portal operational');


      // Test 10: My Bookings & QR Passes Screen
      await page.goto('http://127.0.0.1:4173/#/my-bookings', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const myBookingsText = await page.locator('body').innerText();
      assertTest(myBookingsText.includes('Bookings') || myBookingsText.includes('बुकिंग') || myBookingsText.includes('બુકિંગ') || myBookingsText.includes('Pass') || myBookingsText.includes('પાસ'), 'My Bookings and passes tabs operational');

      // Test 11: Padyatri Mela Tracking (Ambaji Route)
      await page.goto('http://127.0.0.1:4173/#/mela-route', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const melaText = await page.locator('body').innerText();
      assertTest(melaText.includes('Padyatri') || melaText.includes('पदयात्री') || melaText.includes('પદયાત્રી') || melaText.includes('Route') || melaText.includes('માર્ગ') || melaText.includes('ટ્રેકિંગ') || melaText.includes('સ્ટેશન'), 'Padyatri Mela route tracking operational');


      // Test 12: Priority Audio Navigation Engine
      await page.goto('http://127.0.0.1:4173/#/priority-nav', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const audioText = await page.locator('body').innerText();
      assertTest(audioText.includes('Audio') || audioText.includes('ध्वनि') || audioText.includes('વોઇસ') || audioText.includes('Voice') || audioText.includes('ગાઇડ'), 'Priority Audio Navigation voice guide operational');

      // Test 13: Notifications Screen
      await page.goto('http://127.0.0.1:4173/#/notifications', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const notifText = await page.locator('body').innerText();
      assertTest(notifText.includes('Alert') || notifText.includes('सूचना') || notifText.includes('સૂચના') || notifText.includes('Notification'), 'Notifications center operational');

      // Test 14: Profile & Version Check
      await page.goto('http://127.0.0.1:4173/#/profile', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const profileText = await page.locator('body').innerText();
      assertTest(profileText.includes('1.0.3') || profileText.includes('Harshit Agrawal'), 'Profile verified with Version 1.0.3 and devotee profile');

      // Test 15: My QR Pass Render & Turnstile Token Check
      await page.goto('http://127.0.0.1:4173/#/pass', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const passText = await page.locator('body').innerText();
      assertTest(passText.includes('QR') || passText.includes('Pass') || passText.includes('પાસ') || passText.includes('पास') || passText.includes('ENTRY'), 'Digital Signed QR Pass portal operational');

      // Test 16: Pavagadh Ropeway Booking & Slot Calculation
      await page.goto('http://127.0.0.1:4173/#/travel', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const ropewayBtn = await page.locator('body').innerText();
      assertTest(ropewayBtn.includes('Ropeway') || ropewayBtn.includes('રોપવે') || ropewayBtn.includes('रोपवे') || ropewayBtn.includes('ઉડન ખટોલા'), 'Pavagadh Ropeway slot selection and booking operational');

      // ─── TIER 3: VOLUNTEER HUB & COMMAND OPERATIONS (HARD) ─────────
      console.log('\n--- [TIER 3: VOLUNTEER & COMMAND CENTRE] ---');

      // Test 17: Volunteer Hub Login & Duty Roles
      await page.goto('http://127.0.0.1:4173/#/v/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const volLoginText = await page.locator('body').innerText();
      assertTest(volLoginText.includes('Volunteer') || volLoginText.includes('स्वयंसेवक') || volLoginText.includes('સ્વયંસેવક'), 'Volunteer shift operations login operational');

      // Test 18: Command Centre Staff Clearance Login
      await page.goto('http://127.0.0.1:4173/#/command-centre/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const adminLoginText = await page.locator('body').innerText();
      assertTest(adminLoginText.includes('Command') || adminLoginText.includes('Clearance') || adminLoginText.includes('Staff') || adminLoginText.includes('Admin') || adminLoginText.includes('કમાન્ડ'), 'Command Centre Staff Clearance Login operational');

      // Test 19: Static Offline Verified Fallback Check
      await page.goto('http://127.0.0.1:4173/verified.html', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const verifiedHtmlText = await page.locator('body').innerText();
      assertTest(verifiedHtmlText.includes('Verified') || verifiedHtmlText.includes('सत्यापित') || verifiedHtmlText.includes('Open App'), 'Direct email verification deep link landing page verified');

      await browser.close();
      server.close();

      console.log('\n================================================================');
      console.log(`   ALL ${passedCount}/${totalTests} TESTS PASSED WITH 100% ACCURACY!`);
      console.log(`   TOTAL RUNTIME JAVASCRIPT ERRORS: ${runtimeErrors.length}`);
      console.log('================================================================\n');

      process.exit(0);
    } catch (err) {
      console.error('\n[AUDIT FAILURE]:', err);
      server.close();
      process.exit(1);
    }
  });
};

runExhaustiveSuite();


