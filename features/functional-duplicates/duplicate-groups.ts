import { FunctionalDuplicateGroup } from './types';

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
 * Get all functional duplicate groups
 */
export function getFunctionalDuplicateGroups(): FunctionalDuplicateGroup[] {
  return FUNCTIONAL_DUPLICATE_GROUPS;
}

/**
 * Find functional duplicate groups that contain a specific package
 */
export function findGroupsForPackage(packageName: string): FunctionalDuplicateGroup[] {
  return FUNCTIONAL_DUPLICATE_GROUPS.filter(group =>
    group.packages.some(pkg => pkg.toLowerCase() === packageName.toLowerCase())
  );
}

/**
 * Check if two packages are functional duplicates
 */
export function areFunctionalDuplicates(package1: string, package2: string): boolean {
  return FUNCTIONAL_DUPLICATE_GROUPS.some(group => {
    const packages = group.packages.map(p => p.toLowerCase());
    return packages.includes(package1.toLowerCase()) && packages.includes(package2.toLowerCase());
  });
}

