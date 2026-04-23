#!/usr/bin/env node

/**
 * Phase 3 Migration Script: Migrate Utils
 * 
 * This script:
 * 1. Moves pure utilities to core/utils/
 * 2. Moves managers to appropriate locations (services or features)
 * 3. Moves domain-specific utils to features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Migration mappings
const migrations = {
  // Pure utilities → core/utils/
  pureUtils: [
    { from: 'src/utils/audio', to: 'src/core/utils/audio' },
    { from: 'src/utils/device', to: 'src/core/utils/device' },
    { from: 'src/utils/responsive', to: 'src/core/utils/responsive' },
    { from: 'src/utils/native', to: 'src/core/utils/native' },
    { from: 'src/utils/sharing', to: 'src/core/utils/sharing' },
    { from: 'src/utils/devicePerformance.ts', to: 'src/core/utils/device/devicePerformance.ts' },
    { from: 'src/utils/devicePerformance.test.ts', to: 'src/core/utils/device/devicePerformance.test.ts' },
  ],
  
  // Managers → services (infrastructure concerns)
  managersToServices: [
    { from: 'src/utils/managers/adManager.ts', to: 'src/core/services/ads/AdManager.ts' },
    { from: 'src/utils/managers/adManager.test.ts', to: 'src/core/services/ads/AdManager.test.ts' },
    { from: 'src/utils/managers/backgroundManager.ts', to: 'src/core/services/lifecycle/BackgroundManager.ts' },
    { from: 'src/utils/managers/errorHandler.ts', to: 'src/core/services/error/ErrorHandler.ts' },
  ],
  
  // Managers → features (domain logic)
  managersToFeatures: [
    { from: 'src/utils/managers/streakManager.ts', to: 'src/features/game/utils/streakManager.ts' },
  ],
  
  // Domain-specific utils → features
  domainUtils: [
    { from: 'src/utils/game', to: 'src/features/game/utils/game' },
    { from: 'src/utils/animation', to: 'src/features/visual-effects/utils/animation' },
  ],
};

/**
 * Copy directory recursively
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy file
 */
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

/**
 * Create backward compatibility re-export
 */
function createReExport(oldPath, newPath, isDirectory = false) {
  const oldFullPath = path.join(rootDir, oldPath);
  const relativeNewPath = path.relative(path.dirname(oldFullPath), path.join(rootDir, newPath));
  
  if (isDirectory) {
    // For directories, create index.ts re-export
    const reExportPath = path.join(oldFullPath, 'index.ts');
    const reExportContent = `/**
 * DEPRECATED - Use new location
 * 
 * @deprecated This location is deprecated. Use the new location instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export from canonical location
export * from '${relativeNewPath.replace(/\\/g, '/')}';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn('[DEPRECATION] ${oldPath} is deprecated. Use ${newPath} instead.');
}
`;
    
    // Clear directory but keep it
    if (fs.existsSync(oldFullPath)) {
      const entries = fs.readdirSync(oldFullPath);
      for (const entry of entries) {
        const entryPath = path.join(oldFullPath, entry);
        if (fs.statSync(entryPath).isDirectory()) {
          fs.rmSync(entryPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(entryPath);
        }
      }
    } else {
      fs.mkdirSync(oldFullPath, { recursive: true });
    }
    
    fs.writeFileSync(reExportPath, reExportContent);
  } else {
    // For files, create re-export file
    const fileName = path.basename(oldPath);
    const reExportContent = `/**
 * DEPRECATED - Use new location
 * 
 * @deprecated This location is deprecated. Use the new location instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export from canonical location
export * from '${relativeNewPath.replace(/\\/g, '/').replace(/\.(ts|tsx)$/, '')}';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn('[DEPRECATION] ${oldPath} is deprecated. Use ${newPath} instead.');
}
`;
    
    fs.writeFileSync(oldFullPath, reExportContent);
  }
}

/**
 * Migrate a file or directory
 */
function migrate(fromPath, toPath) {
  const srcFullPath = path.join(rootDir, fromPath);
  const destFullPath = path.join(rootDir, toPath);
  
  // Check if source exists
  if (!fs.existsSync(srcFullPath)) {
    console.log(`  ⚠️  Source not found: ${fromPath}`);
    return false;
  }
  
  // Check if already migrated
  if (fs.existsSync(destFullPath)) {
    console.log(`  ⚠️  Already exists: ${toPath}`);
    return false;
  }
  
  // Determine if directory or file
  const isDirectory = fs.statSync(srcFullPath).isDirectory();
  
  // Copy to new location
  console.log(`  → Copying to ${toPath}`);
  if (isDirectory) {
    copyDirectory(srcFullPath, destFullPath);
  } else {
    copyFile(srcFullPath, destFullPath);
  }
  
  // Create backward compatibility re-export
  console.log(`  → Creating backward compatibility layer`);
  createReExport(fromPath, toPath, isDirectory);
  
  return true;
}

/**
 * Create backup
 */
function createBackup() {
  const backupDir = path.join(rootDir, '.migration-backup/phase3-utils');
  const utilsDir = path.join(rootDir, 'src/utils');
  
  console.log('📋 Creating backup...');
  
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
  
  copyDirectory(utilsDir, backupDir);
  console.log(`✅ Backup created: ${backupDir}`);
}

/**
 * Main migration function
 */
function main() {
  console.log('🚀 Phase 3: Utils Migration\n');
  
  // Create backup
  createBackup();
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  // Migrate pure utilities
  console.log('\n📦 Migrating pure utilities to core/utils/...');
  for (const { from, to } of migrations.pureUtils) {
    console.log(`\n  ${from} → ${to}`);
    if (migrate(from, to)) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  }
  
  // Migrate managers to services
  console.log('\n📦 Migrating managers to services...');
  for (const { from, to } of migrations.managersToServices) {
    console.log(`\n  ${from} → ${to}`);
    if (migrate(from, to)) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  }
  
  // Migrate managers to features
  console.log('\n📦 Migrating managers to features...');
  for (const { from, to } of migrations.managersToFeatures) {
    console.log(`\n  ${from} → ${to}`);
    if (migrate(from, to)) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  }
  
  // Migrate domain-specific utils
  console.log('\n📦 Migrating domain-specific utils to features...');
  for (const { from, to } of migrations.domainUtils) {
    console.log(`\n  ${from} → ${to}`);
    if (migrate(from, to)) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`✅ Migrated: ${migratedCount} items`);
  console.log(`⏭️  Skipped: ${skippedCount} items`);
  console.log('\n✨ Phase 3 utils migration complete!');
  console.log('\nNext steps:');
  console.log('1. Run: node scripts/migration/update-imports-phase3.js');
  console.log('2. Run: npm run type-check');
  console.log('3. Run tests to verify functionality');
}

// Run migration
main();
