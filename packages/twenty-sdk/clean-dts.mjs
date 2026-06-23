// Cross-platform cleanup script — rimraf v5 CLI disables globs; programmatic API does not.
import { rimraf } from 'rimraf';

await rimraf([
  'dist/sdk',
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
]);
