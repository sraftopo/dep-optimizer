/**
 * Functional Duplicates Feature
 * 
 * Detects packages that serve similar functional purposes
 * (e.g., moment vs dayjs, lodash vs underscore)
 */

export { FunctionalDuplicateDetector } from './detector';
export { FunctionalDuplicateReporter } from './reporter';
export {
  FUNCTIONAL_DUPLICATE_GROUPS,
  getFunctionalDuplicateGroups,
  findGroupsForPackage,
  areFunctionalDuplicates,
} from './duplicate-groups';
export type {
  FunctionalDuplicate,
  FunctionalDuplicateGroup,
  FunctionalDuplicateResult,
  FoundPackage,
} from './types';
export type { FunctionalDuplicateReportOptions } from './reporter';

