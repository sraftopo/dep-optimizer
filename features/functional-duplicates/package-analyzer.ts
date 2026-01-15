import { PackageInfo } from '../../src/analyzer/scanner';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Extended package metadata extracted from package.json
 */
export interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  repository?: string;
  homepage?: string;
  author?: string;
  license?: string;
}

/**
 * Analyzer for extracting package metadata from local package.json files
 */
export class PackageAnalyzer {
  /**
   * Extract metadata from a PackageInfo by reading its package.json
   */
  extractMetadata(packageInfo: PackageInfo): PackageMetadata | null {
    try {
      const packageJsonPath = path.join(packageInfo.path, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        return null;
      }

      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      return {
        name: packageJson.name || packageInfo.name,
        version: packageJson.version || packageInfo.version,
        description: packageJson.description,
        keywords: Array.isArray(packageJson.keywords) ? packageJson.keywords : undefined,
        repository: this.extractRepositoryUrl(packageJson.repository),
        homepage: packageJson.homepage,
        author: this.extractAuthor(packageJson.author),
        license: this.extractLicense(packageJson.license),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract metadata from multiple packages
   */
  extractMetadataBatch(packages: PackageInfo[]): Map<string, PackageMetadata> {
    const metadataMap = new Map<string, PackageMetadata>();

    for (const pkg of packages) {
      const metadata = this.extractMetadata(pkg);
      if (metadata) {
        metadataMap.set(pkg.name.toLowerCase(), metadata);
      }
    }

    return metadataMap;
  }

  /**
   * Extract repository URL from various formats
   */
  private extractRepositoryUrl(repo: any): string | undefined {
    if (!repo) return undefined;
    
    if (typeof repo === 'string') {
      return repo;
    }
    
    if (typeof repo === 'object' && repo.url) {
      return repo.url;
    }
    
    return undefined;
  }

  /**
   * Extract author information from various formats
   */
  private extractAuthor(author: any): string | undefined {
    if (!author) return undefined;
    
    if (typeof author === 'string') {
      return author;
    }
    
    if (typeof author === 'object' && author.name) {
      return author.name;
    }
    
    return undefined;
  }

  /**
   * Extract license information from various formats
   */
  private extractLicense(license: any): string | undefined {
    if (!license) return undefined;
    
    if (typeof license === 'string') {
      return license;
    }
    
    if (typeof license === 'object' && license.type) {
      return license.type;
    }
    
    return undefined;
  }
}

