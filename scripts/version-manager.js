#!/usr/bin/env node

/**
 * Version Manager
 * 
 * Manages version numbers across package.json, Android build.gradle, and Capacitor config.
 * Follows semantic versioning (MAJOR.MINOR.PATCH).
 * 
 * Usage:
 *   node scripts/version-manager.js patch    # 1.0.0 -> 1.0.1
 *   node scripts/version-manager.js minor    # 1.0.0 -> 1.1.0
 *   node scripts/version-manager.js major    # 1.0.0 -> 2.0.0
 *   node scripts/version-manager.js set 1.2.3  # Set specific version
 *   node scripts/version-manager.js current  # Show current version
 * 
 * Requirements: Task 19.1, Requirement 15.1, 15.2
 */

const fs = require('fs');
const path = require('path');

// File paths
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
const BUILD_GRADLE = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
const CAPACITOR_CONFIG = path.join(__dirname, '..', 'capacitor.config.ts');

/**
 * Parse semantic version string
 */
function parseVersion(versionString) {
  const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${versionString}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Format version object to string
 */
function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Calculate version code from version string
 * Format: MAJOR * 10000 + MINOR * 100 + PATCH
 * Example: 1.2.3 -> 10203
 */
function calculateVersionCode(version) {
  return version.major * 10000 + version.minor * 100 + version.patch;
}

/**
 * Get current version from package.json
 */
function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  return packageJson.version;
}

/**
 * Update package.json version
 */
function updatePackageJson(versionString) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  packageJson.version = versionString;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Updated package.json: ${versionString}`);
}

/**
 * Update Android build.gradle version
 */
function updateBuildGradle(versionString, versionCode) {
  let content = fs.readFileSync(BUILD_GRADLE, 'utf8');
  
  // Update versionCode
  content = content.replace(
    /versionCode\s+\d+/,
    `versionCode ${versionCode}`
  );
  
  // Update versionName
  content = content.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${versionString}"`
  );
  
  fs.writeFileSync(BUILD_GRADLE, content);
  console.log(`✓ Updated build.gradle: ${versionString} (code: ${versionCode})`);
}

/**
 * Update Capacitor config version
 */
function updateCapacitorConfig(versionString) {
  let content = fs.readFileSync(CAPACITOR_CONFIG, 'utf8');
  
  // Update appendUserAgent
  content = content.replace(
    /appendUserAgent:\s*'FluxGrid\/[^']+'/,
    `appendUserAgent: 'FluxGrid/${versionString} Android'`
  );
  
  fs.writeFileSync(CAPACITOR_CONFIG, content);
  console.log(`✓ Updated capacitor.config.ts: ${versionString}`);
}

/**
 * Bump version
 */
function bumpVersion(type) {
  const currentVersionString = getCurrentVersion();
  const version = parseVersion(currentVersionString);
  
  switch (type) {
    case 'major':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor++;
      version.patch = 0;
      break;
    case 'patch':
      version.patch++;
      break;
    default:
      throw new Error(`Invalid bump type: ${type}`);
  }
  
  return formatVersion(version);
}

/**
 * Set all versions
 */
function setVersion(versionString) {
  const version = parseVersion(versionString);
  const versionCode = calculateVersionCode(version);
  
  console.log('\n========================================');
  console.log('FluxGrid Version Manager');
  console.log('========================================\n');
  console.log(`Setting version to: ${versionString}`);
  console.log(`Version code: ${versionCode}\n`);
  
  updatePackageJson(versionString);
  updateBuildGradle(versionString, versionCode);
  updateCapacitorConfig(versionString);
  
  console.log('\n========================================');
  console.log('✓ Version updated successfully!');
  console.log('========================================\n');
  console.log('Next steps:');
  console.log('  1. Commit changes: git add . && git commit -m "chore: bump version to ' + versionString + '"');
  console.log('  2. Create tag: git tag v' + versionString);
  console.log('  3. Push: git push && git push --tags');
  console.log('');
}

/**
 * Show current version
 */
function showCurrentVersion() {
  const versionString = getCurrentVersion();
  const version = parseVersion(versionString);
  const versionCode = calculateVersionCode(version);
  
  console.log('\n========================================');
  console.log('FluxGrid Current Version');
  console.log('========================================\n');
  console.log(`Version: ${versionString}`);
  console.log(`Version Code: ${versionCode}`);
  console.log('');
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node version-manager.js <command> [version]');
    console.error('');
    console.error('Commands:');
    console.error('  patch         Bump patch version (1.0.0 -> 1.0.1)');
    console.error('  minor         Bump minor version (1.0.0 -> 1.1.0)');
    console.error('  major         Bump major version (1.0.0 -> 2.0.0)');
    console.error('  set <version> Set specific version (e.g., 1.2.3)');
    console.error('  current       Show current version');
    console.error('');
    process.exit(1);
  }
  
  const command = args[0];
  
  try {
    switch (command) {
      case 'patch':
      case 'minor':
      case 'major':
        const newVersion = bumpVersion(command);
        setVersion(newVersion);
        break;
      
      case 'set':
        if (args.length < 2) {
          console.error('Error: Missing version argument');
          console.error('Usage: node version-manager.js set <version>');
          process.exit(1);
        }
        setVersion(args[1]);
        break;
      
      case 'current':
        showCurrentVersion();
        break;
      
      default:
        console.error(`Error: Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
