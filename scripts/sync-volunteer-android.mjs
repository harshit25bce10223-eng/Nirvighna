/**
 * Syncs the volunteer web build (dist-volunteer) into the separate
 * volunteer Android project (android-volunteer) for APK builds.
 *
 * Usage: npm run sync:volunteer
 * Then: cd android-volunteer && ./gradlew assembleDebug
 */
import { cpSync, existsSync, rmSync } from 'fs';
import { resolve } from 'path';

const src = resolve(process.cwd(), 'dist-volunteer');
const dest = resolve(process.cwd(), 'android-volunteer', 'app', 'src', 'main', 'assets', 'public');

if (!existsSync(src)) {
  console.error('✗ dist-volunteer/ not found. Run "npm run build:volunteer" first.');
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });

console.log('✓ Volunteer web assets synced into android-volunteer.');
console.log('  Next: cd android-volunteer && ./gradlew assembleDebug');
