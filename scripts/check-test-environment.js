#!/usr/bin/env node

/**
 * Environment Check Script for Android Testing
 * Verifies that all prerequisites are met for Task 18 device testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Android Testing Environment...\n');

let allChecksPass = true;

// Helper function to run commands
function runCommand(command, description) {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ ${description}`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    allChecksPass = false;
    return { success: false, error };
  }
}

// Helper function to check file exists
function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description}`);
    console.log(`   Missing: ${filePath}`);
    allChecksPass = false;
    return false;
  }
}

console.log('📦 Checking Build Files...');
checkFile('dist/index.html', 'Vite build output exists');
checkFile('android/app/build.gradle', 'Android project exists');
checkFile('capacitor.config.ts', 'Capacitor config exists');
console.log();

console.log('🔧 Checking Tools...');
runCommand('node --version', 'Node.js is installed');
runCommand('npm --version', 'npm is installed');

// Check for Android SDK
const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (androidHome) {
  console.log(`✅ Android SDK found at: ${androidHome}`);
} else {
  console.log('❌ Android SDK not found (ANDROID_HOME not set)');
  console.log('   Set ANDROID_HOME environment variable to your Android SDK path');
  allChecksPass = false;
}

// Check for adb
const adbCheck = runCommand('adb version', 'adb (Android Debug Bridge) is available');
console.log();

console.log('📱 Checking Connected Devices...');
try {
  const devices = execSync('adb devices', { encoding: 'utf-8' });
  const deviceLines = devices.split('\n').filter(line => 
    line.trim() && !line.includes('List of devices')
  );
  
  if (deviceLines.length > 0) {
    console.log(`✅ Found ${deviceLines.length} connected device(s):`);
    deviceLines.forEach(line => {
      const [deviceId, status] = line.trim().split(/\s+/);
      console.log(`   - ${deviceId} (${status})`);
    });
  } else {
    console.log('⚠️  No devices connected');
    console.log('   Connect a device or start an emulator to test');
  }
} catch (error) {
  console.log('❌ Could not check for devices');
  allChecksPass = false;
}
console.log();

console.log('📋 Checking Capacitor Plugins...');
try {
  const capacitorConfig = require('../capacitor.config.ts');
  console.log('✅ Capacitor config loaded');
  
  // Check if plugins are installed
  const packageJson = require('../package.json');
  const requiredPlugins = [
    '@capacitor/core',
    '@capacitor/android',
    '@capacitor/haptics',
    '@capacitor/app',
    '@capacitor/status-bar',
    '@capacitor-community/admob'
  ];
  
  requiredPlugins.forEach(plugin => {
    if (packageJson.dependencies[plugin] || packageJson.devDependencies[plugin]) {
      console.log(`✅ ${plugin} is installed`);
    } else {
      console.log(`❌ ${plugin} is NOT installed`);
      allChecksPass = false;
    }
  });
} catch (error) {
  console.log('❌ Could not verify Capacitor plugins');
  allChecksPass = false;
}
console.log();

console.log('🏗️  Checking Android Build Configuration...');
try {
  const buildGradle = fs.readFileSync('android/app/build.gradle', 'utf-8');
  
  // Check for important configurations
  const checks = [
    { pattern: /minSdkVersion.*23/, name: 'minSdkVersion 23' },
    { pattern: /targetSdkVersion.*34/, name: 'targetSdkVersion 34' },
    { pattern: /play-services-ads/, name: 'AdMob dependency' },
    { pattern: /minifyEnabled true/, name: 'ProGuard enabled for release' }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(buildGradle)) {
      console.log(`✅ ${check.name} configured`);
    } else {
      console.log(`⚠️  ${check.name} not found`);
    }
  });
} catch (error) {
  console.log('❌ Could not read build.gradle');
  allChecksPass = false;
}
console.log();

console.log('📄 Checking Documentation...');
checkFile('docs/DEVICE_TESTING_GUIDE.md', 'Device testing guide exists');
checkFile('docs/QUICK_TEST_CHECKLIST.md', 'Quick test checklist exists');
checkFile('docs/PRE_RELEASE_CHECKLIST.md', 'Pre-release checklist exists');
console.log();

// Final summary
console.log('═══════════════════════════════════════════════════════');
if (allChecksPass) {
  console.log('✅ All checks passed! Environment is ready for testing.');
  console.log('\nNext steps:');
  console.log('1. npm run build:android');
  console.log('2. npm run cap:sync');
  console.log('3. npm run cap:open');
  console.log('4. Follow docs/DEVICE_TESTING_GUIDE.md');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\nCommon fixes:');
  console.log('- Install Android Studio and set ANDROID_HOME');
  console.log('- Run: npm install');
  console.log('- Run: npm run build:android');
  console.log('- Connect a device or start an emulator');
  process.exit(1);
}
