import { PackageInfo } from '../../src/analyzer/scanner';

/**
 * Represents a group of packages that serve similar functional purposes
 */
export interface FunctionalDuplicateGroup {
  /** Category/description of what these packages do */
  category: string;
  /** Array of package names that are functionally equivalent */
  packages: string[];
  /** Optional description of the category */
  description?: string;
  /** Optional recommendation for which package to prefer */
  recommended?: string;
}

/**
 * Represents a detected functional duplicate
 */
export interface FunctionalDuplicate {
  /** The category this duplicate belongs to */
  category: string;
  /** Description of the category */
  description?: string;
  /** Packages found in this project that are functionally duplicates */
  foundPackages: FoundPackage[];
  /** Total size of all duplicate packages */
  totalSize: number;
  /** Recommended package to consolidate to (if available) */
  recommended?: string;
}

/**
 * Information about a package found in the project
 */
export interface FoundPackage {
  /** Package name */
  name: string;
  /** Package version */
  version: string;
  /** Package size in bytes */
  size: number;
  /** Path to the package */
  path: string;
}

/**
 * Result of functional duplicate analysis
 */
export interface FunctionalDuplicateResult {
  /** List of detected functional duplicates */
  duplicates: FunctionalDuplicate[];
  /** Total number of functional duplicate groups found */
  totalGroups: number;
  /** Total size that could potentially be saved */
  totalPotentialSavings: number;
}

