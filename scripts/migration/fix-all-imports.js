#!/usr/bin/env node

/**
 * Fix All Imports Script
 * 
 * Comprehensive import path fixer for all migrations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Comprehensive import mappings
const importMappings = {
  // Game utils (migrated to features)
  '@/src/utils/game/gameHelpers': '@features/game/utils/game/gameHelpers',
  '../../../../utils/game/seededRng': '@features/game/utils/game/seededRng',
  '../../../utils/game': '@features/game/utils/game',
  '../../utils/game': '@features/game/utils/game',
  '../utils/game': '@features/game/utils/game',
  
  // Animation utils (migrated to features)
  '../../../utils/animation/animationUtils': '@features/visual-effects/utils/animation/animationUtils',
  '../../utils/animation': '@features/visual-effects/utils/animation',
  '../utils/animation': '@features/visual-effects/utils/animation',
  
  // Managers (migrated to services/features)
  '@/src/utils/managers/adManager': '@core/services/ads/AdManager',
  '../utils/managers/adManager': '@core/services/ads/AdManager',
  '../../utils/managers/adManager': '@core/services/ads/AdManager',
  
  // Performance monitor (deleted, use core version)
  '../utils/performanceMonitor': '@core/services/performance/PerformanceMonitor',
  '../../utils/performanceMonitor': '@core/services/performance/PerformanceMonitor',
  
  // GDPR (migrated to core)
  '@services/gdpr': '@core/services/gdpr',
  '../services/gdpr': '@core/services/gdpr',
  '../../services/gdpr': '@core/services/gdpr',
};

// Directories to scan
const dirsToScan = [
  'src/app',
  'src/features',
  'src/shared',
  'src/components',
  'src/hooks',
  'src/pages',
];

/**
 * Get all files recursively
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

  // Sort by length (longest first) to avoid partial replacements
  const sortedMappings = Object.entries(importMappings).sort((a, b) => b[0].length - a[0].length);

  for (const [oldPath, newPath] of sortedMappings) {
    // Escape special regex characters
    const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match import/export statements
    const importRegex = new RegExp(
      `((?:import|export)\\s+(?:{[^}]+}|[^;]+)\\s+from\\s+['"])${escapedOldPath}(['"])`,
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
  console.log('🔧 Fixing all import paths...\n');

  let totalFiles = 0;
  let modifiedFiles = 0;
  const modifiedFilesList = [];

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
  console.log('📊 Import Fix Summary');
  console.log('='.repeat(60));
  console.log(`📄 Total files scanned: ${totalFiles}`);
  console.log(`✏️  Files modified: ${modifiedFiles}`);

  if (modifiedFiles > 0) {
    console.log('\n📝 Modified files:');
    for (const { file, changes } of modifiedFilesList.slice(0, 30)) {
      console.log(`\n  ${file}`);
      for (const change of changes) {
        console.log(`    • ${change}`);
      }
    }
    
    if (modifiedFilesList.length > 30) {
      console.log(`\n  ... and ${modifiedFilesList.length - 30} more files`);
    }
  }

  console.log('\n✨ Import fix complete!');
}

// Run
main();
