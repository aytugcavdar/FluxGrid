import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localeDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function flattenKeys(value, prefix = '', result = new Set()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) result.add(prefix);
    return result;
  }

  for (const [key, child] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flattenKeys(child, nextPrefix, result);
    } else {
      result.add(nextPrefix);
    }
  }

  return result;
}

const files = fs.readdirSync(localeDir)
  .filter(file => file.endsWith('.json'))
  .sort();

if (files.length === 0) {
  console.error('[i18n] No locale files found.');
  process.exit(1);
}

const localeKeys = new Map();

for (const file of files) {
  const fullPath = path.join(localeDir, file);
  try {
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    localeKeys.set(file, flattenKeys(parsed));
  } catch (error) {
    console.error(`[i18n] Invalid JSON in ${file}: ${error.message}`);
    process.exit(1);
  }
}

const allKeys = new Set();
for (const keys of localeKeys.values()) {
  for (const key of keys) allKeys.add(key);
}

let failed = false;
for (const [file, keys] of localeKeys.entries()) {
  const missing = [...allKeys].filter(key => !keys.has(key)).sort();
  if (missing.length > 0) {
    failed = true;
    console.error(`\n[i18n] ${file} missing ${missing.length} key(s):`);
    for (const key of missing) console.error(`  - ${key}`);
  }
}

if (failed) {
  process.exit(1);
}

const sourceRoot = path.join(__dirname, '..', 'src');
const sourceFiles = [];

function collectSourceFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|example)\.(ts|tsx)$/.test(entry.name)) {
      sourceFiles.push(fullPath);
    }
  }
}

collectSourceFiles(sourceRoot);

const referenceKeys = localeKeys.get('en.json') || localeKeys.values().next().value;
const missingUsageKeys = new Map();
const translationCallPattern = /\b(?:t|i18n\.t)\(\s*['"]([^'"]+)['"]/g;

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = translationCallPattern.exec(source)) !== null) {
    const key = match[1];
    if (!key.includes('.') || key.includes('${') || referenceKeys.has(key)) continue;
    if (!missingUsageKeys.has(key)) missingUsageKeys.set(key, []);
    missingUsageKeys.get(key).push(path.relative(path.join(__dirname, '..'), file));
  }
}

if (missingUsageKeys.size > 0) {
  console.error('\n[i18n] Source code uses missing translation key(s):');
  for (const [key, filesUsingKey] of [...missingUsageKeys.entries()].sort()) {
    console.error(`  - ${key}: ${[...new Set(filesUsingKey)].join(', ')}`);
  }
  process.exit(1);
}

console.log(`[i18n] OK: ${files.length} locale files, ${allKeys.size} keys each.`);
