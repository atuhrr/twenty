// Cross-platform replacement for:
// mkdir -p dist/assets/twenty-client-sdk && cp ../twenty-client-sdk/package.json dist/assets/twenty-client-sdk/ && cp -r ../twenty-client-sdk/dist dist/assets/twenty-client-sdk/dist
import { cpSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dest = resolve(__dirname, 'dist/assets/twenty-client-sdk');
const src = resolve(__dirname, '../twenty-client-sdk');

mkdirSync(dest, { recursive: true });
cpSync(`${src}/package.json`, `${dest}/package.json`);
cpSync(`${src}/dist`, `${dest}/dist`, { recursive: true });
