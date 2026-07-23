#!/usr/bin/env node

/**
 * Build Test APK Script
 * Quickly build a debug APK for testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Test APK...\n');

try {
  // Step 1: Build web assets
  console.log('📦 Step 1/4: Building web assets...');
  execSync('npm run build:android:debug', { stdio: 'inherit' });
  
  // Step 2: Sync Capacitor
  console.log('\n🔄 Step 2/4: Syncing Capacitor...');
  execSync('npm run cap:sync', { stdio: 'inherit' });
  
  // Step 3: Build debug APK
  console.log('\n🔨 Step 3/4: Building debug APK...');
  process.chdir('android');
  execSync('./gradlew assembleDebug', { stdio: 'inherit' });
  process.chdir('..');
  
  // Step 4: Find and report APK location
  console.log('\n✅ Step 4/4: APK built successfully!\n');
  
  const apkPath = path.join('android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('📱 APK Details:');
    console.log(`   Location: ${apkPath}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log('\n📤 Next Steps:');
    console.log('   1. Share the APK with your testers');
    console.log('   2. They need to enable "Install from Unknown Sources"');
    console.log('   3. Install and test the app');
    console.log('\n💡 Tip: Use Firebase App Distribution for easier testing!');
  } else {
    console.error('❌ APK not found at expected location');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
