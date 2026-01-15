import * as fs from 'fs';
import * as path from 'path';
import { FunctionalDuplicateGroup } from './types';
import { PackageMetadata } from './package-analyzer';

/**
 * Cache entry for dynamic groups
 */
interface CacheEntry {
  groups: FunctionalDuplicateGroup[];
  packageNames: string[];
  timestamp: number;
  ttl: number;
}

/**
 * Cache manager for dynamic functional duplicate groups
 */
export class DynamicGroupsCache {
  private readonly cacheDir: string;
  private readonly cacheFile: string;
  private readonly defaultTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  constructor(projectRoot: string = process.cwd()) {
    this.cacheDir = path.join(projectRoot, '.dep-optimizer');
    this.cacheFile = path.join(this.cacheDir, 'dynamic-groups-cache.json');
  }

  /**
   * Get cached groups for a set of package names
   */
  getCachedGroups(packageNames: string[]): FunctionalDuplicateGroup[] | null {
    try {
      if (!fs.existsSync(this.cacheFile)) {
        return null;
      }

      const cacheContent = fs.readFileSync(this.cacheFile, 'utf-8');
      const cache: CacheEntry = JSON.parse(cacheContent);

      // Check if cache is expired
      if (Date.now() - cache.timestamp > cache.ttl) {
        return null;
      }

      // Check if package names match (simple check - could be improved)
      const cachedNames = new Set(cache.packageNames.map(n => n.toLowerCase()));
      const requestedNames = new Set(packageNames.map(n => n.toLowerCase()));

      // If all requested packages are in cache, return cached groups
      // This is a simple check - in practice, you might want more sophisticated matching
      const allMatch = [...requestedNames].every(name => cachedNames.has(name));
      
      if (allMatch) {
        return cache.groups;
      }

      return null;
    } catch (error) {
      // If cache is corrupted, return null
      return null;
    }
  }

  /**
   * Cache groups for a set of package names
   */
  cacheGroups(packageNames: string[], groups: FunctionalDuplicateGroup[], ttl?: number): void {
    try {
      // Ensure cache directory exists
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      const cacheEntry: CacheEntry = {
        groups,
        packageNames,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
      };

      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheEntry, null, 2), 'utf-8');
    } catch (error) {
      console.warn(`Warning: Could not write cache: ${error}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
      }
    } catch (error) {
      console.warn(`Warning: Could not clear cache: ${error}`);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    try {
      if (!fs.existsSync(this.cacheFile)) {
        return;
      }

      const cacheContent = fs.readFileSync(this.cacheFile, 'utf-8');
      const cache: CacheEntry = JSON.parse(cacheContent);

      if (Date.now() - cache.timestamp > cache.ttl) {
        this.clearCache();
      }
    } catch (error) {
      // If cache is corrupted, clear it
      this.clearCache();
    }
  }

  /**
   * Get cache file path
   */
  getCacheFilePath(): string {
    return this.cacheFile;
  }
}

