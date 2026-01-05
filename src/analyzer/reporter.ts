import chalk from 'chalk';
import { DuplicateAnalysisResult, DuplicatePackage, VersionInfo } from './duplicates';
import { ScanResult } from './scanner';

export interface ReportOptions {
  verbose?: boolean;
  json?: boolean;
  showPaths?: boolean;
  minWastedSpace?: number;
}

export class Reporter {
  private options: ReportOptions;

  constructor(options: ReportOptions = {}) {
    this.options = options;
  }

  reportScanResults(scanResult: ScanResult): void {
    if (this.options.json) {
      console.log(JSON.stringify(scanResult, null, 2));
      return;
    }

    console.log(chalk.bold('\n📦 Dependency Scan Results\n'));
    console.log(`Total packages: ${chalk.cyan(scanResult.packages.length)}`);
    console.log(`Total size: ${chalk.cyan(this.formatSize(scanResult.totalSize))}`);
    console.log(`Scanned paths: ${chalk.cyan(scanResult.scannedPaths.length)}`);
  }

  reportDuplicates(result: DuplicateAnalysisResult): void {
    if (this.options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(chalk.bold('\n🔍 Duplicate Package Analysis\n'));

    if (result.totalDuplicates === 0) {
      console.log(chalk.green('✓ No duplicate packages found!'));
      return;
    }

    console.log(chalk.yellow(`Found ${result.totalDuplicates} duplicate packages`));
    console.log(chalk.yellow(`Total wasted space: ${this.formatSize(result.totalWastedSpace)}`));

    if (result.consolidationOpportunities > 0) {
      console.log(chalk.cyan(`${result.consolidationOpportunities} packages can be consolidated\n`));
    }

    for (const duplicate of result.duplicates) {
      if (this.shouldDisplayDuplicate(duplicate)) {
        this.printDuplicatePackage(duplicate);
      }
    }

    this.printSummary(result);
  }

  private shouldDisplayDuplicate(duplicate: DuplicatePackage): boolean {
    if (!this.options.minWastedSpace) {
      return true;
    }
    return duplicate.wastedSpace >= this.options.minWastedSpace;
  }

  private printDuplicatePackage(duplicate: DuplicatePackage): void {
    console.log(chalk.bold(`\n${duplicate.name}`));
    console.log(chalk.gray('─'.repeat(50)));

    console.log(`Versions found: ${chalk.yellow(duplicate.versions.length)}`);
    console.log(`Total instances: ${chalk.yellow(duplicate.totalInstances)}`);
    console.log(`Wasted space: ${chalk.red(this.formatSize(duplicate.wastedSpace))}`);

    if (duplicate.canConsolidate) {
      console.log(chalk.green(`✓ Can consolidate to version ${duplicate.recommendedVersion}`));
    } else {
      console.log(chalk.red('✗ Cannot automatically consolidate (breaking changes)'));
    }

    if (this.options.verbose || this.options.showPaths) {
      console.log(chalk.bold('\nVersions:'));
      for (const version of duplicate.versions) {
        this.printVersionInfo(version);
      }
    }
  }

  private printVersionInfo(version: VersionInfo): void {
    console.log(`  ${chalk.cyan(version.version)} (${version.count} instances, ${this.formatSize(version.size)})`);

    if (this.options.showPaths) {
      for (const path of version.paths) {
        console.log(`    ${chalk.gray(path)}`);
      }
    }
  }

  private printSummary(result: DuplicateAnalysisResult): void {
    console.log(chalk.bold('\n📊 Summary\n'));

    const potentialSavings = result.totalWastedSpace;
    const consolidatable = result.consolidationOpportunities;

    console.log(`Total duplicate packages: ${chalk.yellow(result.totalDuplicates)}`);
    console.log(`Potential space savings: ${chalk.green(this.formatSize(potentialSavings))}`);
    console.log(`Auto-consolidatable packages: ${chalk.cyan(consolidatable)}`);

    if (consolidatable > 0) {
      console.log(chalk.bold.green('\n💡 Recommendation:'));
      console.log('Update your package.json to use compatible version ranges for the consolidatable packages.');
      console.log('Run "npm dedupe" after updating to remove duplicates.');
    }
  }

  reportError(error: Error): void {
    if (this.options.json) {
      console.log(JSON.stringify({ error: error.message }, null, 2));
      return;
    }

    console.error(chalk.red.bold('\n❌ Error:\n'));
    console.error(chalk.red(error.message));

    if (this.options.verbose && error.stack) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
  }

  reportProgress(message: string): void {
    if (!this.options.json) {
      console.log(chalk.gray(`⏳ ${message}...`));
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
  }

  setOptions(options: ReportOptions): void {
    this.options = { ...this.options, ...options };
  }
}
