import { FunctionalDuplicateGroup } from './types';
import { PackageMetadata, PackageAnalyzer } from './package-analyzer';
import { SimilarityAnalyzer } from './similarity-analyzer';
import { NpmClient } from './npm-client';
import { PackageInfo } from '../../src/analyzer/scanner';

/**
 * Generator for dynamic functional duplicate groups
 */
export class DynamicGroupsGenerator {
  private packageAnalyzer: PackageAnalyzer;
  private similarityAnalyzer: SimilarityAnalyzer;
  private npmClient: NpmClient;

  constructor(useNpmRegistry: boolean = true) {
    this.packageAnalyzer = new PackageAnalyzer();
    this.similarityAnalyzer = new SimilarityAnalyzer();
    this.npmClient = useNpmRegistry ? new NpmClient() : null as any;
  }

  /**
   * Generate functional duplicate groups from scanned packages
   */
  async generateGroups(
    packages: PackageInfo[],
    useNpmRegistry: boolean = false
  ): Promise<FunctionalDuplicateGroup[]> {
    // Extract metadata from local package.json files
    const localMetadata = this.packageAnalyzer.extractMetadataBatch(packages);
    
    // Optionally fetch additional metadata from npm registry
    let allMetadata = localMetadata;
    if (useNpmRegistry && this.npmClient) {
      const missingPackages = packages
        .filter(p => !localMetadata.has(p.name.toLowerCase()))
        .map(p => p.name);
      
      if (missingPackages.length > 0) {
        const npmMetadata = await this.npmClient.fetchPackageMetadataBatch(missingPackages);
        // Merge npm metadata with local metadata
        for (const [name, meta] of npmMetadata.entries()) {
          allMetadata.set(name, meta);
        }
      }
    }

    // Find similar packages and group them
    const groups = this.findSimilarGroups(allMetadata);

    return groups;
  }

  /**
   * Find groups of similar packages
   */
  private findSimilarGroups(
    metadataMap: Map<string, PackageMetadata>
  ): FunctionalDuplicateGroup[] {
    const groups: FunctionalDuplicateGroup[] = [];
    const processed = new Set<string>();
    const similarityThreshold = 0.7;

    for (const [name, metadata] of metadataMap.entries()) {
      if (processed.has(name)) {
        continue;
      }

      // Skip packages without descriptions (hard to analyze)
      if (!metadata.description || metadata.description.trim().length === 0) {
        continue;
      }

      // Find similar packages
      const similar = this.similarityAnalyzer.findSimilarPackages(
        metadata,
        metadataMap,
        similarityThreshold
      );

      if (similar.length > 0) {
        // Create a group with this package and its similar packages
        const groupPackages = [
          metadata.name,
          ...similar.map(s => s.package2),
        ];

        // Infer category
        const similarMetadata = similar
          .map(s => metadataMap.get(s.package2.toLowerCase()))
          .filter((m): m is PackageMetadata => m !== undefined);
        
        const category = this.similarityAnalyzer.inferCategory(metadata, similarMetadata);

        // Recommend the most popular package (first one for now, could be improved)
        const recommended = this.selectRecommendedPackage(groupPackages, metadataMap);

        groups.push({
          category,
          description: this.generateDescription(metadata, similarMetadata),
          packages: groupPackages,
          recommended,
        });

        // Mark all packages in this group as processed
        groupPackages.forEach(pkg => processed.add(pkg.toLowerCase()));
      }
    }

    return groups;
  }

  /**
   * Select recommended package from a group
   */
  private selectRecommendedPackage(
    packageNames: string[],
    metadataMap: Map<string, PackageMetadata>
  ): string | undefined {
    // Simple heuristic: prefer packages with more complete metadata
    // In a real implementation, you might consider:
    // - Download counts from npm
    // - Maintenance status
    // - License compatibility
    // - Bundle size

    let bestPackage: string | undefined;
    let bestScore = 0;

    for (const pkgName of packageNames) {
      const metadata = metadataMap.get(pkgName.toLowerCase());
      if (!metadata) continue;

      let score = 0;
      
      // Prefer packages with descriptions
      if (metadata.description) score += 1;
      
      // Prefer packages with keywords
      if (metadata.keywords && metadata.keywords.length > 0) score += 1;
      
      // Prefer packages with repository
      if (metadata.repository) score += 1;

      if (score > bestScore) {
        bestScore = score;
        bestPackage = pkgName;
      }
    }

    return bestPackage || packageNames[0];
  }

  /**
   * Generate description for a group
   */
  private generateDescription(
    primary: PackageMetadata,
    similar: PackageMetadata[]
  ): string {
    // Use the primary package's description as base
    if (primary.description) {
      // Try to generalize it
      const desc = primary.description.toLowerCase();
      
      // Remove package-specific terms
      const generalized = desc
        .replace(/\b\w*package\w*\b/gi, '')
        .replace(/\b\w*library\w*\b/gi, '')
        .replace(/\b\w*module\w*\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (generalized.length > 20) {
        return generalized.charAt(0).toUpperCase() + generalized.slice(1);
      }
    }

    // Fallback: create description from category
    return `Libraries providing similar functionality`;
  }
}

