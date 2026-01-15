import { PackageMetadata } from './package-analyzer';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

/**
 * npm Registry API response structure
 */
export interface NpmRegistryResponse {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  repository?: {
    type: string;
    url: string;
  };
  homepage?: string;
  author?: {
    name: string;
    email?: string;
  } | string;
  license?: string;
  'dist-tags'?: {
    latest: string;
  };
}

/**
 * Client for fetching package metadata from npm registry
 */
export class NpmClient {
  private readonly registryUrl = 'https://registry.npmjs.org';
  private readonly cache = new Map<string, { data: PackageMetadata; timestamp: number }>();
  private readonly cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private requestQueue: Array<() => void> = [];
  private readonly maxConcurrentRequests = 5;
  private activeRequests = 0;

  /**
   * Fetch package metadata from npm registry
   */
  async fetchPackageMetadata(packageName: string): Promise<PackageMetadata | null> {
    // Check cache first
    const cached = this.cache.get(packageName.toLowerCase());
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      // Wait for available slot in request queue
      await this.waitForSlot();

      const url = `${this.registryUrl}/${encodeURIComponent(packageName)}`;
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const data: NpmRegistryResponse = await new Promise((resolve, reject) => {
        const req = client.get(parsedUrl, (res) => {
          if (res.statusCode === 404) {
            resolve(null as any);
            return;
          }

          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Failed to fetch ${packageName}: ${res.statusCode} ${res.statusMessage}`));
            return;
          }

          let responseData = '';
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(responseData);
              resolve(jsonData);
            } catch (error) {
              reject(new Error(`Failed to parse response for ${packageName}: ${error}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(new Error(`Request failed for ${packageName}: ${error.message}`));
        });

        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error(`Request timeout for ${packageName}`));
        });
      });

      if (!data) {
        return null;
      }
      const metadata = this.convertToMetadata(data);

      // Cache the result
      this.cache.set(packageName.toLowerCase(), {
        data: metadata,
        timestamp: Date.now(),
      });

      return metadata;
    } catch (error) {
      console.warn(`Warning: Could not fetch metadata for ${packageName}:`, error);
      return null;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  /**
   * Fetch metadata for multiple packages (batched)
   */
  async fetchPackageMetadataBatch(packageNames: string[]): Promise<Map<string, PackageMetadata>> {
    const metadataMap = new Map<string, PackageMetadata>();
    
    // Fetch in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < packageNames.length; i += batchSize) {
      const batch = packageNames.slice(i, i + batchSize);
      const promises = batch.map(name => 
        this.fetchPackageMetadata(name).then(meta => ({ name, meta }))
      );
      
      const results = await Promise.allSettled(promises);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.meta) {
          metadataMap.set(result.value.name.toLowerCase(), result.value.meta);
        }
      }
    }

    return metadataMap;
  }

  /**
   * Convert npm registry response to PackageMetadata
   */
  private convertToMetadata(data: NpmRegistryResponse): PackageMetadata {
    return {
      name: data.name,
      version: data['dist-tags']?.latest || data.version,
      description: data.description,
      keywords: data.keywords,
      repository: this.extractRepositoryUrl(data.repository),
      homepage: data.homepage,
      author: this.extractAuthor(data.author),
      license: data.license,
    };
  }

  /**
   * Extract repository URL
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
   * Extract author information
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
   * Wait for available slot in request queue
   */
  private async waitForSlot(): Promise<void> {
    if (this.activeRequests < this.maxConcurrentRequests) {
      this.activeRequests++;
      return;
    }

    return new Promise<void>((resolve) => {
      this.requestQueue.push(resolve);
    });
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const resolve = this.requestQueue.shift();
      if (resolve) {
        this.activeRequests++;
        resolve();
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }
}

