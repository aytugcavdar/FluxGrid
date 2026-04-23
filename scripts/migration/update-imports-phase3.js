#!/usr/bin/env node

/**
 * Update Imports Script - Phase 3
 * 
 * Updates import statements for utils migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Import path mappings (old path → new path)
const importMappings = {
  // Pure utilities
  '@/utils/audio': '@core/utils/audio',
  '@/utils/device': '@core/utils/device',
  '@/utils/responsive': '@core/utils/responsive',
  '@/utils/native': '@core/utils/native',
  '@/utils/sharing': '@core/utils/sharing',
  '@/utils/devicePerformance': '@core/utils/device/devicePerformance',
  
  // Managers to services
  '@/utils/managers/adManager': '@core/services/ads/AdManager',
  '@/utils/managers/backgroundManager': '@core/services/lifecycle/BackgroundManager',
  '@/utils/managers/errorHandler': '@core/services/error/ErrorHandler',
  
  // Managers to features
  '@/utils/managers/streakManager': '@features/game/utils/streakManager',
  
  // Domain-specific utils
  '@/utils/game': '@features/game/utils/game',
  '@/utils/animation': '@features/visual-effects/utils/animation',
  
  // Relative paths
  '../utils/audio': '@core/utils/audio',
  '../utils/device': '@core/utils/device',
  '../utils/responsive': '@core/utils/responsive',
  '../utils/native': '@core/utils/native',
  '../utils/sharing': '@core/utils/sharing',
  '../utils/devicePerformance': '@core/utils/device/devicePerformance',
  '../utils/managers/adManager': '@core/services/ads/AdManager',
  '../utils/managers/backgroundManager': '@core/services/lifecycle/BackgroundManager',
  '../utils/managers/errorHandler': '@core/services/error/ErrorHandler',
  '../utils/managers/streakManager': '@features/game/utils/streakManager',
  '../utils/game': '@features/game/utils/game',
  '../utils/animation': '@features/visual-effects/utils/animation',
  
  '../../utils/audio': '@core/utils/audio',
  '../../utils/device': '@core/utils/device',
  '../../utils/responsive': '@core/utils/responsive',
  '../../utils/native': '@core/utils/native',
  '../../utils/sharing': '@core/utils/sharing',
  '../../utils/devicePerformance': '@core/utils/device/devicePerformance',
  '../../utils/managers/adManager': '@core/services/ads/AdManager',
  '../../utils/managers/backgroundManager': '@core/services/lifecycle/BackgroundManager',
  '../../utils/managers/errorHandler': '@core/services/error/ErrorHandler',
  '../../utils/managers/streakManager': '@features/game/utils/streakManager',
  '../../utils/game': '@features/game/utils/game',
  '../../utils/animation': '@features/visual-effects/utils/animation',
};

// Directories to scan
const dirsToScan = [
  'src/app',
  'src/features',
  'src/shared',
  'src/components',
  'src/hooks',
  'src/pages',
  'src/services',
  'src/utils', // Update remaining utils that import each other
];

/**
 * Get all TypeScript/JavaScript files recursively
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

  // Sort mappings by length (longest first) to avoid partial replacements
  const sortedMappings = Object.entries(importMappings).sort((a, b) => b[0].length - a[0].length);

  for (const [oldPath, newPath] of sortedMappings) {
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
  console.log('🔄 Updating imports for Phase 3 (utils migration)...\n');

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
  console.log('📊 Import Update Summary');
  console.log('='.repeat(60));
  console.log(`📄 Total files scanned: ${totalFiles}`);
  console.log(`✏️  Files modified: ${modifiedFiles}`);

  if (modifiedFiles > 0) {
    console.log('\n📝 Modified files:');
    for (const { file, changes } of modifiedFilesList.slice(0, 20)) {
      console.log(`\n  ${file}`);
      for (const change of changes) {
        console.log(`    • ${change}`);
      }
    }
    
    if (modifiedFilesList.length > 20) {
      console.log(`\n  ... and ${modifiedFilesList.length - 20} more files`);
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
