import fs from 'fs';
import path from 'path';

const requiredDirs = [
  'src/core/services',
  'src/core/utils',
  'src/core/state',
  'src/core/types',
  'src/tests/integration',
  'src/tests/e2e',
  'src/tests/property'
];

console.log('Validating Phase 1 structure...\n');

let allValid = true;

requiredDirs.forEach(dir => {
  const exists = fs.existsSync(path.join(process.cwd(), dir));
  console.log(`${exists ? '✓' : '✗'} ${dir}`);
  if (!exists) allValid = false;
});

if (allValid) {
  console.log('\n✓ Phase 1 validation passed');
  process.exit(0);
} else {
  console.log('\n✗ Phase 1 validation failed');
  process.exit(1);
}
