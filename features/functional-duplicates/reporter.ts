import chalk from 'chalk';
import { FunctionalDuplicateResult, FunctionalDuplicate } from './types';

export interface FunctionalDuplicateReportOptions {
  verbose?: boolean;
  json?: boolean;
  showPaths?: boolean;
}

export class FunctionalDuplicateReporter {
  private options: FunctionalDuplicateReportOptions;

  constructor(options: FunctionalDuplicateReportOptions = {}) {
    this.options = options;
  }

  /**
   * Report functional duplicate analysis results
   */
  report(result: FunctionalDuplicateResult): void {
    if (this.options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(chalk.bold('\n🔀 Functional Duplicate Analysis\n'));

    if (result.totalGroups === 0) {
      console.log(chalk.green('✓ No functional duplicates found!'));
      return;
    }

    console.log(
      chalk.yellow(`Found ${result.totalGroups} functional duplicate group(s)`)
    );
    console.log(
      chalk.yellow(
        `Potential savings: ${this.formatSize(result.totalPotentialSavings)}`
      )
    );
    console.log();

    for (const duplicate of result.duplicates) {
      this.printFunctionalDuplicate(duplicate);
    }

    this.printSummary(result);
  }

  private printFunctionalDuplicate(duplicate: FunctionalDuplicate): void {
    console.log(chalk.bold(`\n${duplicate.category}`));
    console.log(chalk.gray('─'.repeat(50)));

    if (duplicate.description) {
      console.log(chalk.gray(duplicate.description));
    }

    console.log(
      chalk.yellow(
        `Found ${duplicate.foundPackages.length} functionally similar package(s):`
      )
    );

    for (const pkg of duplicate.foundPackages) {
      const isRecommended =
        duplicate.recommended &&
        pkg.name.toLowerCase() === duplicate.recommended.toLowerCase();
      const nameDisplay = isRecommended
        ? chalk.green(`✓ ${pkg.name}`)
        : chalk.cyan(pkg.name);

      console.log(
        `  ${nameDisplay} ${chalk.gray(`v${pkg.version}`)} ${chalk.gray(
          `(${this.formatSize(pkg.size)})`
        )}`
      );

      if (this.options.showPaths) {
        console.log(chalk.gray(`    ${pkg.path}`));
      }
    }

    if (duplicate.recommended) {
      const hasRecommended = duplicate.foundPackages.some(
        pkg => pkg.name.toLowerCase() === duplicate.recommended!.toLowerCase()
      );

      if (hasRecommended) {
        console.log(
          chalk.green(
            `\n💡 Recommendation: Consider using only "${duplicate.recommended}"`
          )
        );
      } else {
        console.log(
          chalk.yellow(
            `\n💡 Recommendation: Consider migrating to "${duplicate.recommended}"`
          )
        );
      }
    }

    const potentialSavings = this.calculatePotentialSavings(duplicate);
    if (potentialSavings > 0) {
      console.log(
        chalk.cyan(
          `   Potential space savings: ${this.formatSize(potentialSavings)}`
        )
      );
    }
  }

  private calculatePotentialSavings(duplicate: FunctionalDuplicate): number {
    if (duplicate.foundPackages.length <= 1) {
      return 0;
    }

    const sizes = duplicate.foundPackages.map(p => p.size);
    const maxSize = Math.max(...sizes);
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);

    return totalSize - maxSize;
  }

  private printSummary(result: FunctionalDuplicateResult): void {
    console.log(chalk.bold('\n📊 Summary\n'));

    console.log(
      `Functional duplicate groups found: ${chalk.yellow(result.totalGroups)}`
    );
    console.log(
      `Potential space savings: ${chalk.green(
        this.formatSize(result.totalPotentialSavings)
      )}`
    );

    if (result.totalGroups > 0) {
      console.log(chalk.bold.green('\n💡 Recommendation:'));
      console.log(
        'Consider consolidating to a single package per functional group.'
      );
      console.log(
        'This can reduce bundle size, simplify maintenance, and avoid conflicts.'
      );
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
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

  setOptions(options: FunctionalDuplicateReportOptions): void {
    this.options = { ...this.options, ...options };
  }
}

