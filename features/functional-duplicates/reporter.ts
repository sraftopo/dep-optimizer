import chalk from 'chalk';
import { FunctionalDuplicateResult, FunctionalDuplicate } from './types';

export interface FunctionalDuplicateReportOptions {
  verbose?: boolean;
  json?: boolean;
  showPaths?: boolean;
  showDesc?: boolean;
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

    // Sort packages by level (direct dependencies first)
    const sortedPackages = [...duplicate.foundPackages].sort((a, b) => {
      const levelA = a.level ?? 999;
      const levelB = b.level ?? 999;
      return levelA - levelB;
    });

    for (const pkg of sortedPackages) {
      const isRecommended =
        duplicate.recommended &&
        pkg.name.toLowerCase() === duplicate.recommended.toLowerCase();
      const nameDisplay = isRecommended
        ? chalk.green(`✓ ${pkg.name}`)
        : chalk.cyan(pkg.name);

      const levelDisplay = this.formatLevel(pkg.level);
      const levelColor = pkg.level === 0 ? chalk.green : chalk.yellow;

      console.log(
        `  ${nameDisplay} ${chalk.gray(`v${pkg.version}`)} ${levelColor(levelDisplay)} ${chalk.gray(
          `(${this.formatSize(pkg.size)})`
        )}`
      );

      // Show package description if requested
      if (this.options.showDesc && pkg.description) {
        const desc = pkg.description.length > 100 
          ? pkg.description.substring(0, 100) + '...'
          : pkg.description;
        console.log(chalk.gray(`    ${desc}`));
        
        // Show keywords if available
        if (pkg.keywords && pkg.keywords.length > 0) {
          const keywords = pkg.keywords.slice(0, 5).join(', '); // Limit to 5 keywords
          console.log(chalk.gray(`    Keywords: ${keywords}`));
        }
      }

      // Show where this package is used
      if (pkg.level === 0) {
        // Direct dependency - show it's in package.json
        console.log(chalk.green(`    └─ Required directly in package.json`));
        // Also show if other packages depend on it
        if (pkg.requiredBy && pkg.requiredBy.length > 0) {
          console.log(chalk.gray(`    └─ Also required by:`));
          for (const dependent of pkg.requiredBy) {
            const depType = dependent.isDirect ? chalk.green('[direct]') : chalk.yellow('[transitive]');
            console.log(chalk.gray(`       • ${dependent.name} v${dependent.version} ${depType}`));
          }
        }
      } else if (pkg.requiredBy && pkg.requiredBy.length > 0) {
        // Transitive dependency - show which packages require it
        console.log(chalk.yellow(`    └─ Required by:`));
        for (const dependent of pkg.requiredBy) {
          const depType = dependent.isDirect ? chalk.green('[direct]') : chalk.yellow('[transitive]');
          console.log(chalk.gray(`       • ${dependent.name} v${dependent.version} ${depType}`));
        }
      } else {
        // No dependency info available
        console.log(chalk.gray(`    └─ Dependency information unavailable`));
      }

      if (this.options.showPaths) {
        console.log(chalk.gray(`    Path: ${pkg.path}`));
      }
    }

    // Generate actionable recommendations
    this.printRecommendations(duplicate);

    const potentialSavings = this.calculatePotentialSavings(duplicate);
    if (potentialSavings > 0) {
      console.log(
        chalk.cyan(
          `\n   Potential space savings: ${this.formatSize(potentialSavings)}`
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

    // Count direct vs transitive dependencies
    let directCount = 0;
    let transitiveCount = 0;
    
    for (const duplicate of result.duplicates) {
      for (const pkg of duplicate.foundPackages) {
        if (pkg.level === 0) {
          directCount++;
        } else if (pkg.level !== undefined && pkg.level > 0) {
          transitiveCount++;
        }
      }
    }

    if (directCount > 0 || transitiveCount > 0) {
      console.log(
        `Direct dependencies: ${chalk.green(directCount)} | Transitive dependencies: ${chalk.yellow(transitiveCount)}`
      );
    }

    if (result.totalGroups > 0) {
      console.log(chalk.bold.green('\n💡 Recommendation:'));
      console.log(
        'Consider consolidating to a single package per functional group.'
      );
      if (transitiveCount > 0) {
        console.log(
          chalk.yellow(
            'Note: Some duplicates are transitive dependencies. Review if you can update parent packages to use the same library.'
          )
        );
      }
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

  private formatLevel(level: number | undefined): string {
    if (level === undefined || level === 0) {
      return '[direct]';
    }
    return `[level ${level}]`;
  }

  private printRecommendations(duplicate: FunctionalDuplicate): void {
    console.log(chalk.bold.green('\n💡 Recommendations:\n'));

    const directDeps = duplicate.foundPackages.filter(p => p.level === 0);
    const transitiveDeps = duplicate.foundPackages.filter(p => p.level !== 0 && p.level !== undefined);

    // Separate direct deps into: truly direct only vs direct but also required by others
    const directOnlyDeps = directDeps.filter(p => !p.requiredBy || p.requiredBy.length === 0);
    const directButRequiredDeps = directDeps.filter(p => p.requiredBy && p.requiredBy.length > 0);

    if (duplicate.recommended) {
      const hasRecommended = duplicate.foundPackages.some(
        pkg => pkg.name.toLowerCase() === duplicate.recommended!.toLowerCase()
      );
      const recommendedPkg = duplicate.foundPackages.find(
        pkg => pkg.name.toLowerCase() === duplicate.recommended!.toLowerCase()
      );

      if (hasRecommended && directOnlyDeps.length > 1) {
        // Multiple direct-only dependencies, recommend consolidating to the recommended one
        const otherDirectOnlyDeps = directOnlyDeps.filter(
          p => p.name.toLowerCase() !== duplicate.recommended!.toLowerCase()
        );

        if (otherDirectOnlyDeps.length > 0) {
          console.log(
            chalk.green(`1. Consolidate direct dependencies to "${duplicate.recommended}":`)
          );
          for (const pkg of otherDirectOnlyDeps) {
            console.log(
              chalk.gray(`   • Remove "${pkg.name}" from package.json`)
            );
            console.log(
              chalk.gray(`   • Update your code to use "${duplicate.recommended}" instead`)
            );
          }
        }
      } else if (!hasRecommended && directOnlyDeps.length > 0) {
        // No recommended package installed, suggest migrating
        console.log(
          chalk.yellow(`1. Consider migrating to "${duplicate.recommended}":`)
        );
        for (const pkg of directOnlyDeps) {
          console.log(
            chalk.gray(`   • Remove "${pkg.name}" from package.json`)
          );
          console.log(
            chalk.gray(`   • Add "${duplicate.recommended}" to package.json`)
          );
          console.log(
            chalk.gray(`   • Update your code to use "${duplicate.recommended}"`)
          );
        }
      }

      // Handle packages that are direct BUT also required by others
      if (directButRequiredDeps.length > 0) {
        const otherDirectButRequired = directButRequiredDeps.filter(
          p => !recommendedPkg || p.name.toLowerCase() !== duplicate.recommended!.toLowerCase()
        );

        if (otherDirectButRequired.length > 0) {
          console.log(
            chalk.yellow(`\n2. Packages in package.json that are also required by other dependencies:`)
          );
          for (const pkg of otherDirectButRequired) {
            if (pkg.requiredBy && pkg.requiredBy.length > 0) {
              const deps = pkg.requiredBy.map(d => d.name).join(', ');
              console.log(
                chalk.gray(`   • "${pkg.name}" is also required by: ${deps}`)
              );
              console.log(
                chalk.gray(`     You can remove it from package.json, but those packages will still bring it in`)
              );
              if (hasRecommended) {
                console.log(
                  chalk.gray(`     Consider using npm overrides/resolutions to force "${duplicate.recommended}" instead`)
                );
              }
            }
          }
        }
      }

      // Handle transitive dependencies
      if (transitiveDeps.length > 0) {
        console.log(
          chalk.yellow(`\n${hasRecommended && directOnlyDeps.length > 0 ? '3' : '2'}. Transitive dependencies (brought in by other packages):`)
        );
        for (const pkg of transitiveDeps) {
          if (pkg.requiredBy && pkg.requiredBy.length > 0) {
            const deps = pkg.requiredBy.map(d => d.name).join(', ');
            console.log(
              chalk.gray(`   • ${pkg.name} is required by: ${deps}`)
            );
            if (hasRecommended) {
              console.log(
                chalk.gray(`     Use npm overrides/resolutions to force "${duplicate.recommended}" instead:`)
              );
              console.log(
                chalk.gray(`     "overrides": { "${pkg.name}": "${duplicate.recommended}" }`)
              );
            } else {
              console.log(
                chalk.gray(`     Consider updating those packages or using npm overrides/resolutions`)
              );
            }
          }
        }
      }

      // If only recommended is direct and no others
      if (hasRecommended && directOnlyDeps.length === 1 && directOnlyDeps[0].name.toLowerCase() === duplicate.recommended!.toLowerCase()) {
        if (directButRequiredDeps.length === 0 && transitiveDeps.length === 0) {
          console.log(
            chalk.green(`✓ You're already using "${duplicate.recommended}" as your only dependency in this category`)
          );
        }
      }
    } else {
      // No recommended package specified
      if (directOnlyDeps.length > 1) {
        console.log(
          chalk.yellow(`1. You have ${directOnlyDeps.length} direct dependencies doing the same thing:`)
        );
        console.log(
          chalk.gray(`   Consider keeping only one and removing the others from package.json`)
        );
      }

      if (directButRequiredDeps.length > 0) {
        console.log(
          chalk.yellow(`\n${directOnlyDeps.length > 1 ? '2' : '1'}. Packages in package.json that are also required by other dependencies:`)
        );
        for (const pkg of directButRequiredDeps) {
          if (pkg.requiredBy && pkg.requiredBy.length > 0) {
            const deps = pkg.requiredBy.map(d => d.name).join(', ');
            console.log(
              chalk.gray(`   • "${pkg.name}" is also required by: ${deps}`)
            );
            console.log(
              chalk.gray(`     You can remove it from package.json, but those packages will still bring it in`)
            );
          }
        }
      }

      if (transitiveDeps.length > 0) {
        console.log(
          chalk.yellow(`\n${directOnlyDeps.length > 1 || directButRequiredDeps.length > 0 ? '3' : '1'}. Transitive dependencies:`)
        );
        for (const pkg of transitiveDeps) {
          if (pkg.requiredBy && pkg.requiredBy.length > 0) {
            const deps = pkg.requiredBy.map(d => d.name).join(', ');
            console.log(
              chalk.gray(`   • ${pkg.name} is required by: ${deps}`)
            );
            console.log(
              chalk.gray(`     Consider updating those packages or using npm overrides/resolutions`)
            );
          }
        }
      }
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

  setOptions(options: FunctionalDuplicateReportOptions): void {
    this.options = { ...this.options, ...options };
  }
}

