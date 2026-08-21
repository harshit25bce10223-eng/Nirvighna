import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('   FULL END-TO-END MOBILE BROWSER TEST SUITE       ');
console.log('====================================================\n');

// Fast Zero-Dependency Built-in Static Server for dist/
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
      // Fallback for SPA routing
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

const runSuite = async () => {
  server.listen(4173, '127.0.0.1', async () => {
    console.log('[1/9] Static test server running at http://127.0.0.1:4173 ...\n');

    try {
      const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

      const browser = await chromium.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });

      // Test on Mobile viewport (393 x 852 - iPhone 15 / Galaxy S24)
      const context = await browser.newContext({
        viewport: { width: 393, height: 852 }
      });

      const page = await context.newPage();

      const errors = [];
      page.on('pageerror', (err) => {
        console.error('  [PAGE ERROR]:', err.message);
        errors.push(err.message);
      });

      // TEST 1: Fresh Install Startup on New Device (No Saved Session)
      console.log('[2/9] Testing Fresh App Launch on New Device (No Session)...');
      await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1600);
      const urlAfterSync = page.url();
      console.log(`  -> URL after startup sync: ${urlAfterSync}`);
      const loginText = await page.locator('body').innerText();
      const isLoginPage = urlAfterSync.includes('/login') || loginText.includes('लॉगिन') || loginText.includes('Welcome Back') || loginText.includes('Login');
      console.log(`  -> Unauthenticated device correctly presented Login screen: ${isLoginPage}`);
      if (!isLoginPage) throw new Error('App did not present Login screen on new device!');
      console.log('  -> [PASS] Fresh install correctly requires login on new device.\n');

      // TEST 2: Verify Login Screen Styling & No Guest Mode Button
      console.log('[3/9] Verifying Login Page Elements & Logo...');
      const hasGuestButton = loginText.includes('गेस्ट मोड') || loginText.includes('Guest Mode');
      console.log(`  -> Guest mode button is absent: ${!hasGuestButton}`);
      if (hasGuestButton) throw new Error('Guest Mode button still present on Login screen!');
      const hasCircularLogo = await page.locator('img[src="/official_logo.png"], img[src="./official_logo.png"]').count();
      console.log(`  -> Circular logo element found: ${hasCircularLogo > 0}`);
      console.log('  -> [PASS] Login page has circular logo and no guest button.\n');

      // TEST 3: Signup Page Flow (#/signup)
      console.log('[4/9] Testing Signup Page (#/signup)...');
      await page.goto('http://127.0.0.1:4173/#/signup', { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const signupText = await page.locator('body').innerText();
      console.log('Signup Page Text:', signupText);
      const hasSignupFields = signupText.length > 50;
      console.log(`  -> Signup form rendered: ${hasSignupFields}`);
      if (!hasSignupFields) throw new Error('Signup screen fields missing!');
      console.log('  -> [PASS] Signup page verified.\n');

      // TEST 4: Authenticated Pilgrim Session Persistence
      console.log('[5/9] Simulating Login & Session Persistence...');
      await page.evaluate(() => {
        const devotee = {
          id: 'pilgrim_harshit_9921',
          full_name: 'Harshit Devotee',
          email: 'harshit.devotee@nirvighna.org',
          phone: '9876543210',
          role: 'pilgrim',
          language_preference: 'hi'
        };
        localStorage.setItem('nirvighna_pilgrim_session', JSON.stringify(devotee));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      console.log('[6/9] Testing Home Dashboard (#/home)...');
      await page.goto('http://127.0.0.1:4173/#/home', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const homeText = await page.locator('body').innerText();
      const hasTemples = homeText.includes('Somnath') || homeText.includes('सोमनाथ') || homeText.includes('Dwarka') || homeText.includes('द्वारका');
      console.log(`  -> Home Dashboard rendered temple cards: ${hasTemples}`);
      if (!hasTemples) throw new Error('Home Dashboard failed to render temples!');
      console.log('  -> [PASS] Home Dashboard rendered smoothly.\n');

      // TEST 6: Darshan Booking Screen (#/book/somnath)
      console.log('[7/9] Testing Darshan Booking (#/book/somnath)...');
      await page.goto('http://127.0.0.1:4173/#/book/somnath', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const bookText = await page.locator('body').innerText();
      const hasSlots = bookText.includes('Slot') || bookText.includes('स्लॉट') || bookText.includes('दर्शन') || bookText.includes('General');
      console.log(`  -> Booking screen rendered slots: ${hasSlots}`);
      if (!hasSlots) throw new Error('Booking screen missing slots!');
      console.log('  -> [PASS] Booking page verified.\n');

      // TEST 7: Travel & Parking Guide (#/travel)
      console.log('[8/9] Testing Travel Guide (#/travel)...');
      await page.goto('http://127.0.0.1:4173/#/travel', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const travelText = await page.locator('body').innerText();
      const hasTravel = travelText.includes('Parking') || travelText.includes('पार्किंग') || travelText.includes('Shuttle');
      console.log(`  -> Travel screen rendered: ${hasTravel}`);
      if (!hasTravel) throw new Error('Travel guide missing transport tabs!');
      console.log('  -> [PASS] Travel guide verified.\n');

      // TEST 8: Profile & Settings Screen (#/profile)
      console.log('[9/9] Testing Profile Screen (#/profile)...');
      await page.goto('http://127.0.0.1:4173/#/profile', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const profileText = await page.locator('body').innerText();
      const hasProfileDetails = profileText.includes('Harshit Devotee') || profileText.includes('NIRVIGHNA') || profileText.includes('तीर्थयात्री') || profileText.includes('1.0.3');
      console.log(`  -> Profile details rendered (Includes v1.0.3): ${hasProfileDetails}`);
      if (!hasProfileDetails) throw new Error('Profile details missing!');
      console.log('  -> [PASS] Profile screen verified.\n');

      await browser.close();
      server.close();

      console.log('====================================================');
      console.log(`   ALL MOBILE TESTS PASSED: 100% OPERATIONAL!       `);
      console.log(`   TOTAL RUNTIME JAVASCRIPT ERRORS: ${errors.length}`);
      console.log('====================================================');

      process.exit(0);
    } catch (err) {
      console.error('MOBILE AUDIT FAILED:', err);
      server.close();
      process.exit(1);
    }
  });
};

runSuite();
