import { PackageInfo } from '../../src/analyzer/scanner';
import {
  FunctionalDuplicate,
  FunctionalDuplicateResult,
  FoundPackage,
  DependentPackage,
} from './types';
import {
  FUNCTIONAL_DUPLICATE_GROUPS,
  findGroupsForPackage,
} from './duplicate-groups';
import { PackageAnalyzer } from './package-analyzer';
import { NpmClient } from './npm-client';

export interface DetectorOptions {
  useDynamic?: boolean;
  useNpmRegistry?: boolean;
  useCache?: boolean;
  projectRoot?: string;
}

export class FunctionalDuplicateDetector {
  private packageAnalyzer: PackageAnalyzer;
  private npmClient: NpmClient | null;

  constructor() {
    this.packageAnalyzer = new PackageAnalyzer();
    this.npmClient = null;
  }

  /**
   * Analyze packages and detect functional duplicates
   */
  async analyze(
    packages: PackageInfo[],
    options: DetectorOptions = {}
  ): Promise<FunctionalDuplicateResult> {
    const {
      useDynamic = false,
      useNpmRegistry = false,
      useCache = true,
      projectRoot,
    } = options;
    const packageMap = new Map<string, PackageInfo>();
    
    // Create a map of package names to PackageInfo for quick lookup
    for (const pkg of packages) {
      packageMap.set(pkg.name.toLowerCase(), pkg);
    }

    // Extract metadata for packages (for description display)
    const metadataMap = this.packageAnalyzer.extractMetadataBatch(packages);
    
    // Optionally fetch from npm registry if enabled
    if (useNpmRegistry) {
      if (!this.npmClient) {
        this.npmClient = new NpmClient();
      }
      const missingPackages = packages
        .filter(p => !metadataMap.has(p.name.toLowerCase()))
        .map(p => p.name);
      
      if (missingPackages.length > 0) {
        const npmMetadata = await this.npmClient.fetchPackageMetadataBatch(missingPackages);
        for (const [name, meta] of npmMetadata.entries()) {
          metadataMap.set(name, meta);
        }
      }
    }

    // Build reverse dependency map: which packages depend on which
    const reverseDependencyMap = this.buildReverseDependencyMap(packages, packageMap);

    const detectedDuplicates: FunctionalDuplicate[] = [];
    const processedGroups = new Set<string>();

    // Get all functional duplicate groups (hardcoded + dynamic if enabled)
    const allGroups = useDynamic
      ? await import('./duplicate-groups').then(m =>
          m.getAllFunctionalDuplicateGroups(
            packages,
            useDynamic,
            useNpmRegistry,
            useCache,
            projectRoot
          )
        )
      : FUNCTIONAL_DUPLICATE_GROUPS;

    // Check each package against functional duplicate groups
    for (const pkg of packages) {
      const groups = useDynamic
        ? await findGroupsForPackage(
            pkg.name,
            packages,
            useDynamic,
            useNpmRegistry,
            useCache,
            projectRoot
          )
        : FUNCTIONAL_DUPLICATE_GROUPS.filter(group =>
            group.packages.some(p => p.toLowerCase() === pkg.name.toLowerCase())
          );
      
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
            // Find which packages depend on this one
            const requiredBy = this.findDependents(
              installedPackage.name,
              reverseDependencyMap,
              packageMap
            );

            // Get metadata for description/keywords
            const metadata = metadataMap.get(installedPackage.name.toLowerCase());

            foundPackages.push({
              name: installedPackage.name,
              version: installedPackage.version,
              size: installedPackage.size || 0,
              path: installedPackage.path,
              level: installedPackage.level,
              requiredBy: requiredBy.length > 0 ? requiredBy : undefined,
              description: metadata?.description,
              keywords: metadata?.keywords,
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
  async findDuplicatesForPackage(
    packages: PackageInfo[],
    packageName: string,
    options: DetectorOptions = {}
  ): Promise<FunctionalDuplicate[]> {
    const result = await this.analyze(packages, options);
    
    return result.duplicates.filter(duplicate =>
      duplicate.foundPackages.some(
        pkg => pkg.name.toLowerCase() === packageName.toLowerCase()
      )
    );
  }

  /**
   * Check if a specific package has functional duplicates installed
   */
  async hasFunctionalDuplicates(
    packages: PackageInfo[],
    packageName: string,
    options: DetectorOptions = {}
  ): Promise<boolean> {
    const duplicates = await this.findDuplicatesForPackage(packages, packageName, options);
    return duplicates.length > 0;
  }

  /**
   * Build a reverse dependency map: package name -> list of packages that depend on it
   */
  private buildReverseDependencyMap(
    packages: PackageInfo[],
    packageMap: Map<string, PackageInfo>
  ): Map<string, Set<string>> {
    const reverseMap = new Map<string, Set<string>>();

    for (const pkg of packages) {
      if (pkg.dependencies) {
        for (const depName of Object.keys(pkg.dependencies)) {
          const depKey = depName.toLowerCase();
          if (!reverseMap.has(depKey)) {
            reverseMap.set(depKey, new Set());
          }
          reverseMap.get(depKey)!.add(pkg.name.toLowerCase());
        }
      }
    }

    return reverseMap;
  }

  /**
   * Find which packages depend on a given package
   */
  private findDependents(
    packageName: string,
    reverseDependencyMap: Map<string, Set<string>>,
    packageMap: Map<string, PackageInfo>
  ): DependentPackage[] {
    const dependents: DependentPackage[] = [];
    const dependentNames = reverseDependencyMap.get(packageName.toLowerCase());

    if (!dependentNames || dependentNames.size === 0) {
      return dependents;
    }

    for (const dependentName of dependentNames) {
      const dependentPkg = packageMap.get(dependentName);
      if (dependentPkg) {
        dependents.push({
          name: dependentPkg.name,
          version: dependentPkg.version,
          isDirect: dependentPkg.level === 0,
        });
      }
    }

    // Sort: direct dependencies first, then by name
    dependents.sort((a, b) => {
      if (a.isDirect !== b.isDirect) {
        return a.isDirect ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return dependents;
  }
}

