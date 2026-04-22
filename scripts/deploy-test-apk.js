#!/usr/bin/env node

/**
 * Firebase App Distribution Test APK Deployment Script
 * 
 * Bu script APK'yı Firebase App Distribution'a yükler ve test kullanıcılarına dağıtır.
 * 
 * Kullanım:
 * node scripts/deploy-test-apk.js [options]
 * 
 * Options:
 *   --debug     Debug APK yükle (varsayılan)
 *   --release   Release APK yükle
 *   --groups    Test grupları (virgülle ayrılmış, örn: "testers,beta-users")
 *   --notes     Release notları
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isRelease = args.includes('--release');
const buildType = isRelease ? 'release' : 'debug';

// Get test groups
const groupsIndex = args.indexOf('--groups');
const groups = groupsIndex !== -1 ? args[groupsIndex + 1] : 'testers';

// Get release notes
const notesIndex = args.indexOf('--notes');
const notes = notesIndex !== -1 
  ? args[notesIndex + 1] 
  : `Test build - ${new Date().toLocaleString('tr-TR')}`;

// APK paths
const apkPath = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  buildType,
  `app-${buildType}.apk`
);

console.log('🚀 Firebase App Distribution Deployment');
console.log('========================================');
console.log(`Build Type: ${buildType.toUpperCase()}`);
console.log(`APK Path: ${apkPath}`);
console.log(`Test Groups: ${groups}`);
console.log(`Release Notes: ${notes}`);
console.log('========================================\n');

// Check if APK exists
if (!fs.existsSync(apkPath)) {
  console.error('❌ APK bulunamadı!');
  console.error(`Önce APK build etmelisin: cd android && ./gradlew assemble${buildType.charAt(0).toUpperCase() + buildType.slice(1)}`);
  process.exit(1);
}

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Firebase CLI yüklü değil!');
  console.error('Yüklemek için: npm install -g firebase-tools');
  process.exit(1);
}

// Check if logged in
try {
  execSync('firebase projects:list', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Firebase\'e giriş yapılmamış!');
  console.error('Giriş yapmak için: firebase login');
  process.exit(1);
}

// Get app ID from google-services.json
const googleServicesPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
let appId = null;

if (fs.existsSync(googleServicesPath)) {
  try {
    const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    const androidClient = googleServices.client.find(c => c.client_info.android_client_info);
    if (androidClient) {
      appId = androidClient.client_info.mobilesdk_app_id;
    }
  } catch (error) {
    console.warn('⚠️  google-services.json okunamadı, app ID manuel girilmeli');
  }
}

if (!appId) {
  console.error('❌ Firebase App ID bulunamadı!');
  console.error('google-services.json dosyasını kontrol et veya manuel olarak --app parametresi ile belirt');
  process.exit(1);
}

console.log(`📱 App ID: ${appId}\n`);

// Upload to Firebase App Distribution
try {
  console.log('📤 APK yükleniyor...\n');
  
  const command = `firebase appdistribution:distribute "${apkPath}" \
    --app "${appId}" \
    --groups "${groups}" \
    --release-notes "${notes}"`;
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('\n✅ APK başarıyla yüklendi!');
  console.log('🎉 Test kullanıcıları email ile bilgilendirilecek.');
  
} catch (error) {
  console.error('\n❌ APK yükleme başarısız!');
  console.error(error.message);
  process.exit(1);
}
