import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';

const root = process.cwd();
const gradlePath = path.resolve(root, 'android/app/build.gradle');
const googleTestPublisher = '3940256099942544';
const env = loadEnv('production', root, '');

const errors = [];
for (const key of [
  'VITE_ADMOB_APP_ID',
  'VITE_ADMOB_BANNER_ID',
  'VITE_ADMOB_INTERSTITIAL_ID',
  'VITE_ADMOB_REWARDED_ID',
]) {
  const value = env[key] || '';
  if (!value.startsWith('ca-app-pub-')) errors.push(`${key} is missing or invalid.`);
  if (value.includes(googleTestPublisher)) errors.push(`${key} still uses Google's test ad unit.`);
  if (/X{3,}|_ID$/i.test(value)) errors.push(`${key} still contains a placeholder.`);
}

if (env.VITE_ADMOB_BUILD_MODE !== 'production') {
  errors.push('VITE_ADMOB_BUILD_MODE must be production for a store release.');
}

if (env.VITE_ADMOB_CONSENT_DEBUG === 'true') {
  errors.push('VITE_ADMOB_CONSENT_DEBUG must be false for production.');
}

if (!fs.existsSync(gradlePath)) {
  errors.push(`Missing Android Gradle file: ${gradlePath}`);
} else {
  const gradle = fs.readFileSync(gradlePath, 'utf8');
  const productionAppId = gradle.match(/admobProductionAppId\s*=\s*["']([^"']+)["']/)?.[1] || '';
  const testAppId = gradle.match(/admobTestAppId\s*=\s*["']([^"']+)["']/)?.[1] || '';

  if (productionAppId !== env.VITE_ADMOB_APP_ID) {
    errors.push('Android release AdMob application ID does not match VITE_ADMOB_APP_ID.');
  }
  if (!testAppId.includes(googleTestPublisher)) {
    errors.push('Android debug build must use Google\'s official test application ID.');
  }
  if (!/release\s*\{[\s\S]*?manifestPlaceholders\s*=\s*\[admobAppId:\s*admobProductionAppId\]/.test(gradle)) {
    errors.push('Android release build is not wired to admobProductionAppId.');
  }
  if (!/debug\s*\{[\s\S]*?manifestPlaceholders\s*=\s*\[admobAppId:\s*admobTestAppId\]/.test(gradle)) {
    errors.push('Android debug build is not wired to admobTestAppId.');
  }
}

if (errors.length > 0) {
  console.error('[AdMob production check] FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[AdMob production check] OK: real ad units configured and consent debug disabled.');
