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

console.log(`[i18n] OK: ${files.length} locale files, ${allKeys.size} keys each.`);
