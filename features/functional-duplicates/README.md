# Functional Duplicates Feature

This feature detects packages that serve similar functional purposes in your project. Unlike version duplicates (multiple versions of the same package), functional duplicates are different packages that provide similar functionality.

## Examples

- **Date/Time Libraries**: `moment`, `dayjs`, `date-fns`, `luxon`
- **Utility Libraries**: `lodash`, `underscore`, `ramda`
- **HTTP Clients**: `axios`, `node-fetch`, `got`, `superagent`
- **State Management**: `redux`, `mobx`, `zustand`, `recoil`

## Usage

### From CLI

```bash
# Check for functional duplicates
dep-optimizer functional-duplicates

# With verbose output
dep-optimizer functional-duplicates --verbose

# Show package paths
dep-optimizer functional-duplicates --show-paths

# JSON output
dep-optimizer functional-duplicates --json
```

### Programmatically

```typescript
import { FunctionalDuplicateDetector } from './features/functional-duplicates';
import { DependencyScanner } from './src/analyzer/scanner';

const scanner = new DependencyScanner(projectPath);
const scanResult = await scanner.scan();

const detector = new FunctionalDuplicateDetector();
const result = detector.analyze(scanResult.packages);

console.log(`Found ${result.totalGroups} functional duplicate groups`);
```

## How It Works

1. **Database of Groups**: The feature maintains a database of known functional duplicate groups (see `duplicate-groups.ts`)

2. **Detection**: When analyzing your `node_modules`, it checks if multiple packages from the same functional group are installed

3. **Reporting**: It reports:
   - Which functional groups have duplicates
   - Which packages are installed from each group
   - Potential space savings
   - Recommendations for consolidation

## Adding New Groups

To add new functional duplicate groups, edit `duplicate-groups.ts`:

```typescript
{
  category: 'Your Category',
  description: 'Description of what these packages do',
  packages: ['package1', 'package2', 'package3'],
  recommended: 'package1', // Optional
}
```

## Files

- `types.ts` - TypeScript type definitions
- `duplicate-groups.ts` - Database of known functional duplicate groups
- `detector.ts` - Core detection logic
- `reporter.ts` - Output formatting and reporting
- `index.ts` - Public API exports

