import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directories = [
  'src/core/services/base',
  'src/core/services/firebase',
  'src/core/services/analytics',
  'src/core/services/storage',
  'src/core/services/performance',
  'src/core/services/security',
  'src/core/services/network',
  'src/core/services/ads',
  'src/core/services/notifications',
  'src/core/services/crash',
  'src/core/services/haptics',
  'src/core/utils/calculations',
  'src/core/utils/formatters',
  'src/core/utils/validators',
  'src/core/utils/transformers',
  'src/core/utils/constants',
  'src/core/utils/device',
  'src/core/utils/audio',
  'src/core/utils/native',
  'src/core/utils/sharing',
  'src/core/utils/responsive',
  'src/core/state',
  'src/core/types',
  'src/tests/integration',
  'src/tests/e2e',
  'src/tests/property'
];

console.log('Phase 1: Creating core directory structure...\n');

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  } else {
    console.log(`- Exists: ${dir}`);
  }
});

console.log('\n✓ Phase 1 complete: Core structure created');
