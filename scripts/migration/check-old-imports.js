/**
 * Check for old import patterns that should be updated
 * 
 * This script searches for deprecated import patterns and reports them.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// Patterns to search for (old imports that should be updated)
const patterns = [
  {
    pattern: /@services\/storage\/storageService/,
    replacement: '@core/services/storage/StorageService',
    description: 'StorageService import'
  },
  {
    pattern: /@services\/local\/localStorageService/,
    replacement: '@core/services/storage/StorageService',
    description: 'LocalStorageService import'
  },
  {
    pattern: /@services\/performance\/performanceMonitor/,
    replacement: '@core/services/performance/PerformanceMonitor',
    description: 'PerformanceMonitor import'
  },
  {
    pattern: /@shared\/store\/settingsStore/,
    replacement: '@core/state/settingsStore',
    description: 'settingsStore import (should use core)'
  },
  {
    pattern: /from.*features\/performance\/store\/settingsStore/,
    replacement: '@core/state/settingsStore',
    description: 'Performance settingsStore import'
  },
  {
    pattern: /@utils\/managers\//,
    replacement: '@core/services/ or @features/',
    description: 'Utils managers import'
  }
];

// Recursively get all TypeScript/JavaScript files
function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, etc.
      if (!['node_modules', 'dist', 'build', '.git', '.migration-backup'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

console.log('🔍 Checking for old import patterns...\n');

const srcDir = join(rootDir, 'src');
const allFiles = getAllFiles(srcDir);

let totalIssues = 0;
const issuesByPattern = new Map();

// Search each file for patterns
allFiles.forEach(filePath => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Skip backup files and re-export files
    const relativePath = filePath.replace(rootDir + '\\', '').replace(rootDir + '/', '');
    if (relativePath.includes('.backup.') || 
        relativePath.includes('\\services\\local\\localStorageService.ts') ||
        relativePath.includes('\\services\\storage\\storageService.ts') ||
        relativePath.includes('\\services\\performance\\performanceMonitor.ts') ||
        relativePath.includes('\\shared\\store\\settingsStore.ts') ||
        relativePath.includes('\\shared\\store\\tutorialStore.ts') ||
        relativePath.includes('\\features\\performance\\store\\settingsStore.ts')) {
      return; // Skip these files
    }
    
    patterns.forEach(({ pattern, replacement, description }, patternIndex) => {
      lines.forEach((line, lineIndex) => {
        if (pattern.test(line)) {
          if (!issuesByPattern.has(patternIndex)) {
            issuesByPattern.set(patternIndex, []);
          }
          
          issuesByPattern.get(patternIndex).push({
            file: relativePath,
            line: lineIndex + 1,
            content: line.trim()
          });
          totalIssues++;
        }
      });
    });
  } catch (error) {
    // Skip files that can't be read
  }
});

// Report findings
patterns.forEach(({ pattern, replacement, description }, patternIndex) => {
  console.log(`Checking: ${description}`);
  console.log(`  Pattern: ${pattern.source}`);
  console.log(`  Should be: ${replacement}`);
  
  const issues = issuesByPattern.get(patternIndex) || [];
  
  if (issues.length > 0) {
    console.log(`  ❌ Found ${issues.length} occurrence(s):`);
    issues.slice(0, 5).forEach(({ file, line, content }) => {
      console.log(`     ${file}:${line}`);
      console.log(`       ${content}`);
    });
    if (issues.length > 5) {
      console.log(`     ... and ${issues.length - 5} more`);
    }
  } else {
    console.log(`  ✅ No occurrences found`);
  }
  
  console.log('');
});

console.log('═'.repeat(60));
if (totalIssues === 0) {
  console.log('✅ All imports are up to date!');
  console.log('   Safe to remove backward compatibility layer.');
  process.exit(0);
} else {
  console.log(`❌ Found ${totalIssues} old import(s) that need updating.`);
  console.log('   Update these imports before removing compatibility layer.');
  process.exit(1);
}
