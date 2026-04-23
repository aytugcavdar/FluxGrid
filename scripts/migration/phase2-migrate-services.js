#!/usr/bin/env node

/**
 * Phase 2 Migration Script: Migrate Services to core/services/
 * 
 * This script moves service directories from src/services/ to src/core/services/
 * while preserving backward compatibility through re-exports.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Services to migrate (excluding already migrated ones)
const servicesToMigrate = [
  'firebase',
  'analytics',
  'security',
  'network',
  'ads',
  'notifications',
  'crash',
  'haptics',
  'gdpr',
  'ab-test',
  'api',
  'version',
  'logging',
  'monitoring'
];

// Services to skip (already migrated or special cases)
const servicesToSkip = [
  'storage',      // Already migrated
  'performance',  // Already migrated
  'local',        // Backward compatibility layer
  'core'          // Special directory
];

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
 * Get all TypeScript/JavaScript files in a directory
 */
function getExportedFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(entry.name);
    }
  }

  return files;
}

/**
 * Create backward compatibility re-export file
 */
function createReExport(serviceName, files) {
  const oldPath = path.join(rootDir, 'src/services', serviceName);
  const newRelativePath = `../../core/services/${serviceName}`;
  
  // Find main export file
  const mainFile = files.find(f => 
    f === 'index.ts' || 
    f === 'index.tsx' || 
    f === `${serviceName}.ts` ||
    f === `${serviceName}Service.ts` ||
    f === `${serviceName}Manager.ts`
  );

  if (!mainFile) {
    console.warn(`⚠️  No main export file found for ${serviceName}, skipping re-export`);
    return;
  }

  const reExportContent = `/**
 * ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/${serviceName} instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { ... } from '@/services/${serviceName}'
 * - New: import { ... } from '@core/services/${serviceName}'
 */

// Re-export from canonical location
export * from '${newRelativePath}/${mainFile.replace(/\.(ts|tsx)$/, '')}';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] services/${serviceName} is deprecated. ' +
    'Use @core/services/${serviceName} instead.'
  );
}
`;

  // Remove old directory contents but keep the directory
  if (fs.existsSync(oldPath)) {
    const entries = fs.readdirSync(oldPath);
    for (const entry of entries) {
      const entryPath = path.join(oldPath, entry);
      if (fs.statSync(entryPath).isDirectory()) {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(entryPath);
      }
    }
  } else {
    fs.mkdirSync(oldPath, { recursive: true });
  }

  // Write re-export file
  const reExportPath = path.join(oldPath, mainFile);
  fs.writeFileSync(reExportPath, reExportContent);
  console.log(`  ✓ Created re-export: ${reExportPath}`);
}

/**
 * Migrate a service
 */
function migrateService(serviceName) {
  const srcPath = path.join(rootDir, 'src/services', serviceName);
  const destPath = path.join(rootDir, 'src/core/services', serviceName);

  console.log(`\n📦 Migrating ${serviceName}...`);

  // Check if source exists
  if (!fs.existsSync(srcPath)) {
    console.log(`  ⚠️  Source not found: ${srcPath}`);
    return false;
  }

  // Check if already migrated
  if (fs.existsSync(destPath)) {
    console.log(`  ⚠️  Already exists at destination: ${destPath}`);
    return false;
  }

  // Get exported files before migration
  const files = getExportedFiles(srcPath);

  // Copy to new location
  console.log(`  → Copying to ${destPath}`);
  copyDirectory(srcPath, destPath);

  // Create backward compatibility re-export
  console.log(`  → Creating backward compatibility layer`);
  createReExport(serviceName, files);

  console.log(`  ✅ ${serviceName} migrated successfully`);
  return true;
}

/**
 * Create backup
 */
function createBackup() {
  const backupDir = path.join(rootDir, '.migration-backup/phase2-services');
  const servicesDir = path.join(rootDir, 'src/services');

  console.log('📋 Creating backup...');
  
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }

  copyDirectory(servicesDir, backupDir);
  console.log(`✅ Backup created: ${backupDir}`);
}

/**
 * Main migration function
 */
function main() {
  console.log('🚀 Phase 2: Services Migration\n');
  console.log('This script will migrate services from src/services/ to src/core/services/\n');

  // Create backup
  createBackup();

  // Migrate services
  let migratedCount = 0;
  let skippedCount = 0;

  for (const serviceName of servicesToMigrate) {
    if (servicesToSkip.includes(serviceName)) {
      console.log(`\n⏭️  Skipping ${serviceName} (already migrated or special case)`);
      skippedCount++;
      continue;
    }

    const success = migrateService(serviceName);
    if (success) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`✅ Migrated: ${migratedCount} services`);
  console.log(`⏭️  Skipped: ${skippedCount} services`);
  console.log('\n✨ Phase 2 services migration complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run type-check');
  console.log('2. Update imports using: node scripts/migration/update-imports.js');
  console.log('3. Run tests to verify functionality');
}

// Run migration
main();
