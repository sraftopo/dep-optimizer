#!/usr/bin/env node

import { Command } from 'commander';
import { DependencyScanner } from './analyzer/scanner';
import { DuplicateDetector } from './analyzer/duplicates';
import { Reporter } from './analyzer/reporter';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('dep-optimizer')
  .description('Smart dependency analyzer and optimizer for Node.js projects')
  .version('0.0.1');

/**
 * Check if postinstall should be skipped
 * Returns true if opt-out is configured or if running in dep-optimizer's own directory
 */
function shouldSkipPostinstall(projectPath: string): boolean {
  // Check environment variable
  if (process.env.DEP_OPTIMIZER_SKIP_POSTINSTALL === 'true') {
    return true;
  }

  // Check package.json config
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.depOptimizer?.skipPostinstall === true) {
        return true;
      }
    }
  } catch (error) {
    // Ignore errors reading package.json
  }

  // Check if running in dep-optimizer's own directory
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.name === 'dep-optimizer') {
        return true;
      }
    }
  } catch (error) {
    // Ignore errors reading package.json
  }

  return false;
}

program
  .command('scan')
  .description('Scan dependencies in the current project')
  .option('-p, --path <path>', 'Project path to analyze', process.cwd())
  .option('-v, --verbose', 'Show verbose output', false)
  .option('--json', 'Output results in JSON format', false)
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.path);
      const reporter = new Reporter({ verbose: options.verbose, json: options.json });

      reporter.reportProgress('Scanning dependencies');

      const scanner = new DependencyScanner(projectPath);
      const scanResult = await scanner.scan();

      reporter.reportScanResults(scanResult);
    } catch (error) {
      const reporter = new Reporter({ verbose: options.verbose, json: options.json });
      reporter.reportError(error as Error);
      process.exit(1);
    }
  });

program
  .command('duplicates')
  .description('Find and analyze duplicate dependencies')
  .option('-p, --path <path>', 'Project path to analyze', process.cwd())
  .option('-v, --verbose', 'Show verbose output', false)
  .option('--json', 'Output results in JSON format', false)
  .option('--show-paths', 'Show file paths for each version', false)
  .option('--min-waste <size>', 'Minimum wasted space in bytes to display', parseInt)
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.path);
      const reporter = new Reporter({
        verbose: options.verbose,
        json: options.json,
        showPaths: options.showPaths,
        minWastedSpace: options.minWaste,
      });

      reporter.reportProgress('Scanning dependencies');

      const scanner = new DependencyScanner(projectPath);
      const scanResult = await scanner.scan();

      reporter.reportProgress('Analyzing duplicates');

      const detector = new DuplicateDetector();
      const duplicateResult = detector.analyze(scanResult.packages);

      reporter.reportDuplicates(duplicateResult);
    } catch (error) {
      const reporter = new Reporter({ verbose: options.verbose, json: options.json });
      reporter.reportError(error as Error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Complete analysis: scan and find duplicates')
  .option('-p, --path <path>', 'Project path to analyze', process.cwd())
  .option('-v, --verbose', 'Show verbose output', false)
  .option('--json', 'Output results in JSON format', false)
  .option('--show-paths', 'Show file paths for each version', false)
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.path);
      const reporter = new Reporter({
        verbose: options.verbose,
        json: options.json,
        showPaths: options.showPaths,
      });

      reporter.reportProgress('Scanning dependencies');

      const scanner = new DependencyScanner(projectPath);
      const scanResult = await scanner.scan();

      reporter.reportScanResults(scanResult);

      reporter.reportProgress('Analyzing duplicates');

      const detector = new DuplicateDetector();
      const duplicateResult = detector.analyze(scanResult.packages);

      reporter.reportDuplicates(duplicateResult);
    } catch (error) {
      const reporter = new Reporter({ verbose: options.verbose, json: options.json });
      reporter.reportError(error as Error);
      process.exit(1);
    }
  });

program
  .command('check <package>')
  .description('Check for duplicate versions of a specific package')
  .option('-p, --path <path>', 'Project path to analyze', process.cwd())
  .option('-v, --verbose', 'Show verbose output', false)
  .option('--json', 'Output results in JSON format', false)
  .option('--show-paths', 'Show file paths for each version', false)
  .action(async (packageName, options) => {
    try {
      const projectPath = path.resolve(options.path);
      const reporter = new Reporter({
        verbose: options.verbose,
        json: options.json,
        showPaths: options.showPaths,
      });

      reporter.reportProgress(`Checking for duplicates of ${packageName}`);

      const scanner = new DependencyScanner(projectPath);
      const packages = await scanner.scanPackage(packageName);

      if (packages.length === 0) {
        if (!options.json) {
          console.log(`Package "${packageName}" not found in dependencies.`);
        }
        return;
      }

      if (packages.length === 1) {
        if (!options.json) {
          console.log(`Package "${packageName}" has only one version: ${packages[0].version}`);
        }
        return;
      }

      const detector = new DuplicateDetector();
      const scanResult = await scanner.scan();
      const duplicate = detector.findDuplicatesByName(scanResult.packages, packageName);

      if (duplicate && !options.json) {
        console.log(`\nFound ${duplicate.versions.length} versions of ${packageName}:`);
        for (const version of duplicate.versions) {
          console.log(`  - ${version.version} (${version.count} instances)`);
          if (options.showPaths) {
            version.paths.forEach(p => console.log(`    ${p}`));
          }
        }

        if (duplicate.canConsolidate) {
          console.log(`\n✓ Can consolidate to version ${duplicate.recommendedVersion}`);
        }
      } else if (options.json && duplicate) {
        console.log(JSON.stringify(duplicate, null, 2));
      }
    } catch (error) {
      const reporter = new Reporter({ verbose: options.verbose, json: options.json });
      reporter.reportError(error as Error);
      process.exit(1);
    }
  });

program
  .command('postinstall')
  .description('Run analysis automatically after npm install (internal use)')
  .option('-p, --path <path>', 'Project path to analyze', process.cwd())
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.path);

      // Check if we should skip postinstall
      if (shouldSkipPostinstall(projectPath)) {
        return;
      }

      const reporter = new Reporter({
        verbose: false,
        json: false,
        showPaths: false,
      });

      reporter.reportProgress('Scanning dependencies');

      const scanner = new DependencyScanner(projectPath);
      const scanResult = await scanner.scan();

      reporter.reportScanResults(scanResult);

      reporter.reportProgress('Analyzing duplicates');

      const detector = new DuplicateDetector();
      const duplicateResult = detector.analyze(scanResult.packages);

      reporter.reportDuplicates(duplicateResult);
    } catch (error) {
      // Graceful error handling - warn but don't fail the install
      const reporter = new Reporter({ verbose: false, json: false });
      console.warn('\n⚠️  dep-optimizer: Analysis failed during postinstall (this will not block installation)');
      reporter.reportError(error as Error);
      // Don't call process.exit(1) - allow install to complete
    }
  });

if (process.argv.length === 2) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
