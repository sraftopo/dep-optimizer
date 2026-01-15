import { FunctionalDuplicateGroup } from './types';
import { DynamicGroupsGenerator } from './dynamic-groups';
import { DynamicGroupsCache } from './cache';
import { PackageInfo } from '../../src/analyzer/scanner';

/**
 * Database of known functional duplicate groups
 * This can be extended with more groups as needed
 */
export const FUNCTIONAL_DUPLICATE_GROUPS: FunctionalDuplicateGroup[] = [
  {
    category: 'Date/Time Manipulation',
    description: 'Libraries for parsing, validating, manipulating, and displaying dates',
    packages: ['moment', 'dayjs', 'date-fns', 'luxon', 'js-joda'],
    recommended: 'dayjs',
  },
  {
    category: 'Utility Functions',
    description: 'Collections of utility functions for JavaScript',
    packages: ['lodash', 'underscore', 'ramda', 'lodash-es'],
    recommended: 'lodash',
  },
  {
    category: 'HTTP Clients',
    description: 'Libraries for making HTTP requests',
    packages: ['axios', 'node-fetch', 'got', 'superagent', 'request', 'request-promise'],
    recommended: 'axios',
  },
  {
    category: 'Promise Utilities',
    description: 'Libraries that provide promise utilities and helpers',
    packages: ['bluebird', 'q', 'when'],
    recommended: 'Native Promises',
  },
  {
    category: 'CSS-in-JS',
    description: 'Libraries for writing CSS in JavaScript',
    packages: ['styled-components', 'emotion', 'aphrodite', 'glamorous', 'jss'],
    recommended: 'styled-components',
  },
  {
    category: 'State Management',
    description: 'Libraries for managing application state',
    packages: ['redux', 'mobx', 'zustand', 'recoil', 'jotai'],
    recommended: 'redux',
  },
  {
    category: 'Form Validation',
    description: 'Libraries for form validation',
    packages: ['joi', 'yup', 'zod', 'ajv', 'validator'],
    recommended: 'zod',
  },
  {
    category: 'Template Engines',
    description: 'Libraries for templating and string interpolation',
    packages: ['handlebars', 'mustache', 'ejs', 'pug', 'nunjucks'],
    recommended: 'handlebars',
  },
  {
    category: 'Testing Frameworks',
    description: 'JavaScript testing frameworks',
    packages: ['jest', 'mocha', 'jasmine', 'ava', 'tape', 'vitest'],
    recommended: 'jest',
  },
  {
    category: 'Assertion Libraries',
    description: 'Libraries for writing test assertions',
    packages: ['chai', 'should', 'expect', 'assert'],
    recommended: 'chai',
  },
  {
    category: 'Logging',
    description: 'Libraries for application logging',
    packages: ['winston', 'bunyan', 'pino', 'log4js'],
    recommended: 'pino',
  },
  {
    category: 'Command Line Parsing',
    description: 'Libraries for parsing command-line arguments',
    packages: ['commander', 'yargs', 'minimist', 'meow'],
    recommended: 'commander',
  },
  {
    category: 'Environment Variables',
    description: 'Libraries for managing environment variables',
    packages: ['dotenv', 'dotenv-expand', 'env-cmd'],
    recommended: 'dotenv',
  },
  {
    category: 'UUID Generation',
    description: 'Libraries for generating UUIDs',
    packages: ['uuid', 'nanoid', 'shortid'],
    recommended: 'uuid',
  },
  {
    category: 'Deep Clone',
    description: 'Libraries for deep cloning objects',
    packages: ['lodash.clonedeep', 'clone-deep', 'rfdc', 'deepclone'],
    recommended: 'lodash.clonedeep',
  },
  {
    category: 'Debounce/Throttle',
    description: 'Libraries for debouncing and throttling functions',
    packages: ['lodash.debounce', 'lodash.throttle', 'debounce', 'throttle-debounce'],
    recommended: 'lodash.debounce',
  },
];

/**
 * Get all functional duplicate groups (hardcoded only)
 */
export function getFunctionalDuplicateGroups(): FunctionalDuplicateGroup[] {
  return FUNCTIONAL_DUPLICATE_GROUPS;
}

/**
 * Get all functional duplicate groups including dynamic ones
 */
export async function getAllFunctionalDuplicateGroups(
  packages?: PackageInfo[],
  useDynamic: boolean = false,
  useNpmRegistry: boolean = false,
  useCache: boolean = true,
  projectRoot?: string
): Promise<FunctionalDuplicateGroup[]> {
  const allGroups = [...FUNCTIONAL_DUPLICATE_GROUPS];

  if (useDynamic && packages && packages.length > 0) {
    const cache = new DynamicGroupsCache(projectRoot);
    let dynamicGroups: FunctionalDuplicateGroup[] = [];

    // Try to get from cache first
    if (useCache) {
      const packageNames = packages.map(p => p.name);
      const cached = cache.getCachedGroups(packageNames);
      if (cached) {
        dynamicGroups = cached;
      }
    }

    // Generate dynamic groups if not cached
    if (dynamicGroups.length === 0) {
      const generator = new DynamicGroupsGenerator(useNpmRegistry);
      dynamicGroups = await generator.generateGroups(packages, useNpmRegistry);

      // Cache the results
      if (useCache && dynamicGroups.length > 0) {
        const packageNames = packages.map(p => p.name);
        cache.cacheGroups(packageNames, dynamicGroups);
      }
    }

    // Merge dynamic groups with hardcoded ones
    // Avoid duplicates by checking if packages are already in hardcoded groups
    for (const dynamicGroup of dynamicGroups) {
      const isDuplicate = allGroups.some(hardcodedGroup => {
        const hardcodedPackages = new Set(
          hardcodedGroup.packages.map(p => p.toLowerCase())
        );
        const dynamicPackages = dynamicGroup.packages.map(p => p.toLowerCase());
        return dynamicPackages.some(p => hardcodedPackages.has(p));
      });

      if (!isDuplicate) {
        allGroups.push(dynamicGroup);
      }
    }
  }

  return allGroups;
}

/**
 * Find functional duplicate groups that contain a specific package
 * First checks hardcoded groups, then falls back to dynamic groups if enabled
 */
export async function findGroupsForPackage(
  packageName: string,
  packages?: PackageInfo[],
  useDynamic: boolean = false,
  useNpmRegistry: boolean = false,
  useCache: boolean = true,
  projectRoot?: string
): Promise<FunctionalDuplicateGroup[]> {
  // First check hardcoded groups
  const hardcodedGroups = FUNCTIONAL_DUPLICATE_GROUPS.filter(group =>
    group.packages.some(pkg => pkg.toLowerCase() === packageName.toLowerCase())
  );

  if (hardcodedGroups.length > 0 || !useDynamic || !packages) {
    return hardcodedGroups;
  }

  // Fallback to dynamic groups
  const allGroups = await getAllFunctionalDuplicateGroups(
    packages,
    useDynamic,
    useNpmRegistry,
    useCache,
    projectRoot
  );

  return allGroups.filter(group =>
    group.packages.some(pkg => pkg.toLowerCase() === packageName.toLowerCase())
  );
}

/**
 * Check if two packages are functional duplicates
 * First checks hardcoded groups, then falls back to dynamic groups if enabled
 */
export async function areFunctionalDuplicates(
  package1: string,
  package2: string,
  packages?: PackageInfo[],
  useDynamic: boolean = false,
  useNpmRegistry: boolean = false,
  useCache: boolean = true,
  projectRoot?: string
): Promise<boolean> {
  // First check hardcoded groups
  const inHardcoded = FUNCTIONAL_DUPLICATE_GROUPS.some(group => {
    const packages = group.packages.map(p => p.toLowerCase());
    return packages.includes(package1.toLowerCase()) && packages.includes(package2.toLowerCase());
  });

  if (inHardcoded || !useDynamic || !packages) {
    return inHardcoded;
  }

  // Fallback to dynamic groups
  const allGroups = await getAllFunctionalDuplicateGroups(
    packages,
    useDynamic,
    useNpmRegistry,
    useCache,
    projectRoot
  );

  return allGroups.some(group => {
    const packages = group.packages.map(p => p.toLowerCase());
    return packages.includes(package1.toLowerCase()) && packages.includes(package2.toLowerCase());
  });
}

