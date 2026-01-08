import { PackageInfo } from '../../src/analyzer/scanner';
import {
  FunctionalDuplicate,
  FunctionalDuplicateResult,
  FoundPackage,
} from './types';
import {
  FUNCTIONAL_DUPLICATE_GROUPS,
  findGroupsForPackage,
} from './duplicate-groups';

export class FunctionalDuplicateDetector {
  /**
   * Analyze packages and detect functional duplicates
   */
  analyze(packages: PackageInfo[]): FunctionalDuplicateResult {
    const packageMap = new Map<string, PackageInfo>();
    
    // Create a map of package names to PackageInfo for quick lookup
    for (const pkg of packages) {
      packageMap.set(pkg.name.toLowerCase(), pkg);
    }

    const detectedDuplicates: FunctionalDuplicate[] = [];
    const processedGroups = new Set<string>();

    // Check each package against functional duplicate groups
    for (const pkg of packages) {
      const groups = findGroupsForPackage(pkg.name);
      
      for (const group of groups) {
        // Use category as unique identifier for groups
        const groupKey = group.category;
        
        if (processedGroups.has(groupKey)) {
          continue;
        }

        // Find all packages from this group that are installed
        const foundPackages: FoundPackage[] = [];
        
        for (const groupPackageName of group.packages) {
          const installedPackage = packageMap.get(groupPackageName.toLowerCase());
          
          if (installedPackage) {
            foundPackages.push({
              name: installedPackage.name,
              version: installedPackage.version,
              size: installedPackage.size || 0,
              path: installedPackage.path,
            });
          }
        }

        // Only add if we found more than one package from this group
        if (foundPackages.length > 1) {
          const totalSize = foundPackages.reduce((sum, pkg) => sum + pkg.size, 0);
          
          detectedDuplicates.push({
            category: group.category,
            description: group.description,
            foundPackages,
            totalSize,
            recommended: group.recommended,
          });

          processedGroups.add(groupKey);
        }
      }
    }

    // Calculate potential savings (size of all but the largest package)
    const totalPotentialSavings = detectedDuplicates.reduce((total, duplicate) => {
      if (duplicate.foundPackages.length <= 1) {
        return total;
      }
      
      const sizes = duplicate.foundPackages.map(p => p.size);
      const maxSize = Math.max(...sizes);
      const totalSize = sizes.reduce((sum, size) => sum + size, 0);
      
      return total + (totalSize - maxSize);
    }, 0);

    // Sort by total size (largest first)
    detectedDuplicates.sort((a, b) => b.totalSize - a.totalSize);

    return {
      duplicates: detectedDuplicates,
      totalGroups: detectedDuplicates.length,
      totalPotentialSavings,
    };
  }

  /**
   * Find functional duplicates for a specific package
   */
  findDuplicatesForPackage(
    packages: PackageInfo[],
    packageName: string
  ): FunctionalDuplicate[] {
    const result = this.analyze(packages);
    
    return result.duplicates.filter(duplicate =>
      duplicate.foundPackages.some(
        pkg => pkg.name.toLowerCase() === packageName.toLowerCase()
      )
    );
  }

  /**
   * Check if a specific package has functional duplicates installed
   */
  hasFunctionalDuplicates(
    packages: PackageInfo[],
    packageName: string
  ): boolean {
    const duplicates = this.findDuplicatesForPackage(packages, packageName);
    return duplicates.length > 0;
  }
}

