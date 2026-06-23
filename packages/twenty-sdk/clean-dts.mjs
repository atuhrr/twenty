// rimraf v5 on Windows rejects glob patterns (pathArg check at line 34).
// Solution: expand globs with the `glob` package first, then delete resolved paths.
import { rimraf } from 'rimraf';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const patterns = [
  'dist/define/**/*.d.ts',
  'dist/define/**/*.d.ts.map',
  'dist/billing/**/*.d.ts',
  'dist/billing/**/*.d.ts.map',
  'dist/front-component/**/*.d.ts',
  'dist/front-component/**/*.d.ts.map',
  'dist/logic-function/**/*.d.ts',
  'dist/logic-function/**/*.d.ts.map',
  'dist/utils/**/*.d.ts',
  'dist/utils/**/*.d.ts.map',
];

const files = (
  await Promise.all(patterns.map((p) => glob(p, { cwd: __dirname, absolute: true })))
).flat();

if (files.length > 0) {
  await rimraf(files);
}

await rimraf(`${__dirname}/dist/sdk`);
