#!/usr/bin/env node

/**
 * Android Build Async Script
 * 
 * Bu script Android build işlemini arka planda çalıştırır ve
 * progress gösterir. Build tamamlandığında bildirim verir.
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  log(`${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message) {
  log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

async function runCommand(command, args, cwd = rootDir) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function buildAndroid(buildType = 'debug') {
  const startTime = Date.now();
  
  log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.bright}${colors.blue}║   FluxGrid Android Build (${buildType.toUpperCase()})   ║${colors.reset}`);
  log(`${colors.bright}${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Step 1: Build web assets
    logStep('1/4', 'Building web assets with Vite...');
    await runCommand('npm', ['run', 'build:android']);
    logSuccess('Web assets built successfully');

    // Step 2: Sync with Capacitor
    logStep('2/4', 'Syncing with Capacitor...');
    await runCommand('npx', ['cap', 'sync', 'android']);
    logSuccess('Capacitor sync completed');

    // Step 3: Check for signing configuration
    const keyPropertiesPath = join(rootDir, 'android', 'key.properties');
    const hasSigningConfig = existsSync(keyPropertiesPath);
    
    if (buildType === 'release' && !hasSigningConfig) {
      logInfo('No signing configuration found (key.properties)');
      logInfo('Release build will be unsigned');
    }

    // Step 4: Build Android APK/Bundle
    const androidDir = join(rootDir, 'android');
    const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    
    let gradleTask;
    if (buildType === 'bundle') {
      logStep('3/4', 'Building Android App Bundle (AAB)...');
      gradleTask = 'bundleRelease';
    } else if (buildType === 'release') {
      logStep('3/4', 'Building Release APK...');
      gradleTask = 'assembleRelease';
    } else {
      logStep('3/4', 'Building Debug APK...');
      gradleTask = 'assembleDebug';
    }

    await runCommand(gradlewCmd, [gradleTask], androidDir);
    logSuccess('Android build completed');

    // Step 4: Show output location
    logStep('4/4', 'Build artifacts location:');
    
    if (buildType === 'bundle') {
      const bundlePath = join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
      logInfo(`AAB: ${bundlePath}`);
    } else if (buildType === 'release') {
      const apkPath = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
      logInfo(`APK: ${apkPath}`);
    } else {
      const apkPath = join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
      logInfo(`APK: ${apkPath}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log(`\n${colors.bright}${colors.green}╔════════════════════════════════════════╗${colors.reset}`);
    log(`${colors.bright}${colors.green}║     Build Completed Successfully!     ║${colors.reset}`);
    log(`${colors.bright}${colors.green}╚════════════════════════════════════════╝${colors.reset}`);
    log(`${colors.cyan}Total time: ${duration}s${colors.reset}\n`);

  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const buildType = args[0] || 'debug'; // debug, release, or bundle

if (!['debug', 'release', 'bundle'].includes(buildType)) {
  logError(`Invalid build type: ${buildType}`);
  logInfo('Usage: node android-build-async.js [debug|release|bundle]');
  process.exit(1);
}

// Run the build
buildAndroid(buildType);
