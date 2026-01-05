import * as semver from 'semver';
import { PackageInfo } from './scanner';

export interface DuplicatePackage {
  name: string;
  versions: VersionInfo[];
  totalInstances: number;
  wastedSpace: number;
  canConsolidate: boolean;
  recommendedVersion?: string;
}

export interface VersionInfo {
  version: string;
  paths: string[];
  size: number;
  count: number;
}

export interface DuplicateAnalysisResult {
  duplicates: DuplicatePackage[];
  totalDuplicates: number;
  totalWastedSpace: number;
  consolidationOpportunities: number;
}

export class DuplicateDetector {
  analyze(packages: PackageInfo[]): DuplicateAnalysisResult {
    const packageMap = this.groupPackagesByName(packages);
    const duplicates: DuplicatePackage[] = [];
    let totalWastedSpace = 0;
    let consolidationOpportunities = 0;

    for (const [name, versions] of packageMap.entries()) {
      if (versions.length > 1) {
        const duplicateInfo = this.analyzeDuplicatePackage(name, versions);
        duplicates.push(duplicateInfo);
        totalWastedSpace += duplicateInfo.wastedSpace;
        if (duplicateInfo.canConsolidate) {
          consolidationOpportunities++;
        }
      }
    }

    duplicates.sort((a, b) => b.wastedSpace - a.wastedSpace);

    return {
      duplicates,
      totalDuplicates: duplicates.length,
      totalWastedSpace,
      consolidationOpportunities,
    };
  }

  private groupPackagesByName(packages: PackageInfo[]): Map<string, PackageInfo[]> {
    const map = new Map<string, PackageInfo[]>();

    for (const pkg of packages) {
      if (!map.has(pkg.name)) {
        map.set(pkg.name, []);
      }
      map.get(pkg.name)!.push(pkg);
    }

    return map;
  }

  private analyzeDuplicatePackage(name: string, packages: PackageInfo[]): DuplicatePackage {
    const versionMap = new Map<string, VersionInfo>();

    for (const pkg of packages) {
      if (!versionMap.has(pkg.version)) {
        versionMap.set(pkg.version, {
          version: pkg.version,
          paths: [],
          size: pkg.size || 0,
          count: 0,
        });
      }

      const versionInfo = versionMap.get(pkg.version)!;
      versionInfo.paths.push(pkg.path);
      versionInfo.count++;
    }

    const versions = Array.from(versionMap.values());
    const totalInstances = packages.length;
    const wastedSpace = this.calculateWastedSpace(versions);
    const canConsolidate = this.canConsolidateVersions(versions.map(v => v.version));
    const recommendedVersion = canConsolidate ? this.getRecommendedVersion(versions) : undefined;

    return {
      name,
      versions,
      totalInstances,
      wastedSpace,
      canConsolidate,
      recommendedVersion,
    };
  }

  private calculateWastedSpace(versions: VersionInfo[]): number {
    if (versions.length <= 1) {
      return 0;
    }

    const maxSize = Math.max(...versions.map(v => v.size));
    const totalSize = versions.reduce((sum, v) => sum + v.size, 0);
    return totalSize - maxSize;
  }

  private canConsolidateVersions(versions: string[]): boolean {
    if (versions.length <= 1) {
      return false;
    }

    const sortedVersions = versions
      .filter(v => semver.valid(v))
      .sort((a, b) => semver.compare(b, a));

    if (sortedVersions.length === 0) {
      return false;
    }

    const highest = sortedVersions[0];

    return sortedVersions.every(v => {
      const range = `^${v}`;
      return semver.satisfies(highest, range);
    });
  }

  private getRecommendedVersion(versions: VersionInfo[]): string {
    const validVersions = versions
      .map(v => v.version)
      .filter(v => semver.valid(v))
      .sort((a, b) => semver.compare(b, a));

    return validVersions[0] || versions[0].version;
  }

  findDuplicatesByName(packages: PackageInfo[], packageName: string): DuplicatePackage | null {
    const filtered = packages.filter(pkg => pkg.name === packageName);

    if (filtered.length <= 1) {
      return null;
    }

    return this.analyzeDuplicatePackage(packageName, filtered);
  }

  getSummary(result: DuplicateAnalysisResult): string {
    const summary: string[] = [];

    summary.push(`Found ${result.totalDuplicates} duplicate packages`);

    if (result.totalWastedSpace > 0) {
      const wastedMB = (result.totalWastedSpace / (1024 * 1024)).toFixed(2);
      summary.push(`Total wasted space: ${wastedMB} MB`);
    }

    if (result.consolidationOpportunities > 0) {
      summary.push(`${result.consolidationOpportunities} packages can be consolidated`);
    }

    return summary.join('\n');
  }
}
