#!/usr/bin/env node

/**
 * Update Imports Script
 * 
 * This script updates import statements across the codebase to use new paths
 * after services have been migrated to core/services/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Import path mappings (old path → new path)
const importMappings = {
  // Services
  '@/services/firebase': '@core/services/firebase',
  '@/services/analytics': '@core/services/analytics',
  '@/services/security': '@core/services/security',
  '@/services/network': '@core/services/network',
  '@/services/ads': '@core/services/ads',
  '@/services/notifications': '@core/services/notifications',
  '@/services/crash': '@core/services/crash',
  '@/services/haptics': '@core/services/haptics',
  '@/services/gdpr': '@core/services/gdpr',
  '@/services/ab-test': '@core/services/ab-test',
  '@/services/api': '@core/services/api',
  '@/services/version': '@core/services/version',
  '@/services/logging': '@core/services/logging',
  '@/services/monitoring': '@core/services/monitoring',
  '@/services/storage': '@core/services/storage',
  '@/services/performance': '@core/services/performance',
  
  // Relative paths (for files in src/services/)
  '../services/firebase': '@core/services/firebase',
  '../services/analytics': '@core/services/analytics',
  '../services/security': '@core/services/security',
  '../services/network': '@core/services/network',
  '../services/ads': '@core/services/ads',
  '../services/notifications': '@core/services/notifications',
  '../services/crash': '@core/services/crash',
  '../services/haptics': '@core/services/haptics',
  '../services/gdpr': '@core/services/gdpr',
  '../services/ab-test': '@core/services/ab-test',
  '../services/api': '@core/services/api',
  '../services/version': '@core/services/version',
  '../services/logging': '@core/services/logging',
  '../services/monitoring': '@core/services/monitoring',
  '../services/storage': '@core/services/storage',
  '../services/performance': '@core/services/performance',
};

// Directories to scan
const dirsToScan = [
  'src/app',
  'src/features',
  'src/shared',
  'src/components',
  'src/hooks',
  'src/pages',
  'src/services', // Update remaining services that import each other
];

/**
 * Get all TypeScript/JavaScript files in a directory recursively
 */
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Update imports in a file
 */
function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];

  // Update each import mapping
  for (const [oldPath, newPath] of Object.entries(importMappings)) {
    // Match import statements with the old path
    const importRegex = new RegExp(
      `(import\\s+(?:{[^}]+}|[^;]+)\\s+from\\s+['"])${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`,
      'g'
    );

    if (importRegex.test(content)) {
      content = content.replace(importRegex, `$1${newPath}$2`);
      modified = true;
      changes.push(`${oldPath} → ${newPath}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changes;
  }

  return null;
}

/**
 * Main function
 */
function main() {
  console.log('🔄 Updating imports across codebase...\n');

  let totalFiles = 0;
  let modifiedFiles = 0;
  const modifiedFilesList = [];

  // Scan each directory
  for (const dir of dirsToScan) {
    const fullPath = path.join(rootDir, dir);
    console.log(`📂 Scanning ${dir}...`);

    const files = getAllFiles(fullPath);
    totalFiles += files.length;

    for (const file of files) {
      const changes = updateImportsInFile(file);
      if (changes) {
        modifiedFiles++;
        const relativePath = path.relative(rootDir, file);
        modifiedFilesList.push({ file: relativePath, changes });
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Update Summary');
  console.log('='.repeat(60));
  console.log(`📄 Total files scanned: ${totalFiles}`);
  console.log(`✏️  Files modified: ${modifiedFiles}`);

  if (modifiedFiles > 0) {
    console.log('\n📝 Modified files:');
    for (const { file, changes } of modifiedFilesList) {
      console.log(`\n  ${file}`);
      for (const change of changes) {
        console.log(`    • ${change}`);
      }
    }
  }

  console.log('\n✨ Import update complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run type-check');
  console.log('2. Run: npm test');
  console.log('3. Review changes and commit');
}

// Run
main();
