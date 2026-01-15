/**
 * Functional Duplicates Feature
 * 
 * Detects packages that serve similar functional purposes
 * (e.g., moment vs dayjs, lodash vs underscore)
 */

export { FunctionalDuplicateDetector } from './detector';
export { FunctionalDuplicateReporter } from './reporter';
export { PackageAnalyzer } from './package-analyzer';
export { SimilarityAnalyzer } from './similarity-analyzer';
export { DynamicGroupsGenerator } from './dynamic-groups';
export { DynamicGroupsCache } from './cache';
export { NpmClient } from './npm-client';
export {
  FUNCTIONAL_DUPLICATE_GROUPS,
  getFunctionalDuplicateGroups,
  getAllFunctionalDuplicateGroups,
  findGroupsForPackage,
  areFunctionalDuplicates,
} from './duplicate-groups';
export type {
  FunctionalDuplicate,
  FunctionalDuplicateGroup,
  FunctionalDuplicateResult,
  FoundPackage,
  DependentPackage,
} from './types';
export type { FunctionalDuplicateReportOptions } from './reporter';
export type { DetectorOptions } from './detector';
export type { PackageMetadata } from './package-analyzer';

