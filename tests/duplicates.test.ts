import { DuplicateDetector } from '../src/analyzer/duplicates';
import { PackageInfo } from '../src/analyzer/scanner';

describe('DuplicateDetector', () => {
  let detector: DuplicateDetector;

  beforeEach(() => {
    detector = new DuplicateDetector();
  });

  describe('analyze', () => {
    it('should return empty result when no packages provided', () => {
      const result = detector.analyze([]);

      expect(result.totalDuplicates).toBe(0);
      expect(result.duplicates).toHaveLength(0);
      expect(result.totalWastedSpace).toBe(0);
      expect(result.consolidationOpportunities).toBe(0);
    });

    it('should return empty result when no duplicates exist', () => {
      const packages: PackageInfo[] = [
        { name: 'pkg-a', version: '1.0.0', path: '/node_modules/pkg-a', size: 1000 },
        { name: 'pkg-b', version: '2.0.0', path: '/node_modules/pkg-b', size: 2000 },
        { name: 'pkg-c', version: '3.0.0', path: '/node_modules/pkg-c', size: 3000 },
      ];

      const result = detector.analyze(packages);

      expect(result.totalDuplicates).toBe(0);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should detect duplicate packages with different versions', () => {
      const packages: PackageInfo[] = [
        { name: 'lodash', version: '4.17.20', path: '/node_modules/lodash', size: 5000 },
        { name: 'lodash', version: '4.17.21', path: '/node_modules/pkg-a/node_modules/lodash', size: 5100 },
        { name: 'react', version: '17.0.0', path: '/node_modules/react', size: 10000 },
      ];

      const result = detector.analyze(packages);

      expect(result.totalDuplicates).toBe(1);
      expect(result.duplicates[0].name).toBe('lodash');
      expect(result.duplicates[0].versions).toHaveLength(2);
      expect(result.duplicates[0].totalInstances).toBe(2);
    });

    it('should calculate wasted space correctly', () => {
      const packages: PackageInfo[] = [
        { name: 'pkg', version: '1.0.0', path: '/node_modules/pkg', size: 1000 },
        { name: 'pkg', version: '1.0.1', path: '/node_modules/a/node_modules/pkg', size: 1000 },
        { name: 'pkg', version: '1.0.2', path: '/node_modules/b/node_modules/pkg', size: 1000 },
      ];

      const result = detector.analyze(packages);

      expect(result.duplicates[0].wastedSpace).toBe(2000);
      expect(result.totalWastedSpace).toBe(2000);
    });

    it('should identify packages that can be consolidated', () => {
      const packages: PackageInfo[] = [
        { name: 'pkg', version: '1.0.0', path: '/node_modules/pkg', size: 1000 },
        { name: 'pkg', version: '1.0.1', path: '/node_modules/a/node_modules/pkg', size: 1000 },
      ];

      const result = detector.analyze(packages);

      expect(result.duplicates[0].canConsolidate).toBe(true);
      expect(result.duplicates[0].recommendedVersion).toBe('1.0.1');
      expect(result.consolidationOpportunities).toBe(1);
    });

    it('should identify packages that cannot be consolidated due to breaking changes', () => {
      const packages: PackageInfo[] = [
        { name: 'pkg', version: '1.0.0', path: '/node_modules/pkg', size: 1000 },
        { name: 'pkg', version: '2.0.0', path: '/node_modules/a/node_modules/pkg', size: 1000 },
      ];

      const result = detector.analyze(packages);

      expect(result.duplicates[0].canConsolidate).toBe(false);
      expect(result.consolidationOpportunities).toBe(0);
    });

    it('should sort duplicates by wasted space descending', () => {
      const packages: PackageInfo[] = [
        { name: 'small', version: '1.0.0', path: '/node_modules/small', size: 100 },
        { name: 'small', version: '1.0.1', path: '/node_modules/a/small', size: 100 },
        { name: 'large', version: '1.0.0', path: '/node_modules/large', size: 10000 },
        { name: 'large', version: '1.0.1', path: '/node_modules/a/large', size: 10000 },
        { name: 'large', version: '1.0.2', path: '/node_modules/b/large', size: 10000 },
      ];

      const result = detector.analyze(packages);

      expect(result.duplicates[0].name).toBe('large');
      expect(result.duplicates[1].name).toBe('small');
    });

    it('should handle multiple instances of the same version', () => {
      const packages: PackageInfo[] = [
        { name: 'pkg', version: '1.0.0', path: '/node_modules/pkg', size: 1000 },
        { name: 'pkg', version: '1.0.0', path: '/node_modules/a/node_modules/pkg', size: 1000 },
        { name: 'pkg', version: '2.0.0', path: '/node_modules/b/node_modules/pkg', size: 1000 },
      ];

      const result = detector.analyze(packages);

      expect(result.duplicates[0].versions).toHaveLength(2);
      expect(result.duplicates[0].totalInstances).toBe(3);

      const v1 = result.duplicates[0].versions.find(v => v.version === '1.0.0');
      expect(v1?.count).toBe(2);
      expect(v1?.paths).toHaveLength(2);
    });
  });

  describe('findDuplicatesByName', () => {
    it('should return null when package has only one version', () => {
      const packages: PackageInfo[] = [
        { name: 'pkg', version: '1.0.0', path: '/node_modules/pkg', size: 1000 },
        { name: 'other', version: '1.0.0', path: '/node_modules/other', size: 1000 },
      ];

      const result = detector.findDuplicatesByName(packages, 'pkg');

      expect(result).toBeNull();
    });

    it('should return null when package is not found', () => {
      const packages: PackageInfo[] = [
        { name: 'pkg', version: '1.0.0', path: '/node_modules/pkg', size: 1000 },
      ];

      const result = detector.findDuplicatesByName(packages, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return duplicate info for specific package', () => {
      const packages: PackageInfo[] = [
        { name: 'target', version: '1.0.0', path: '/node_modules/target', size: 1000 },
        { name: 'target', version: '1.0.1', path: '/node_modules/a/target', size: 1000 },
        { name: 'other', version: '1.0.0', path: '/node_modules/other', size: 1000 },
        { name: 'other', version: '2.0.0', path: '/node_modules/a/other', size: 1000 },
      ];

      const result = detector.findDuplicatesByName(packages, 'target');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('target');
      expect(result?.versions).toHaveLength(2);
    });
  });

  describe('getSummary', () => {
    it('should generate correct summary text', () => {
      const result = {
        duplicates: [
          {
            name: 'pkg1',
            versions: [],
            totalInstances: 2,
            wastedSpace: 1000,
            canConsolidate: true,
          },
          {
            name: 'pkg2',
            versions: [],
            totalInstances: 3,
            wastedSpace: 2000,
            canConsolidate: false,
          },
        ],
        totalDuplicates: 2,
        totalWastedSpace: 3000,
        consolidationOpportunities: 1,
      };

      const summary = detector.getSummary(result);

      expect(summary).toContain('Found 2 duplicate packages');
      expect(summary).toContain('Total wasted space: 0.00 MB');
      expect(summary).toContain('1 packages can be consolidated');
    });

    it('should handle zero duplicates', () => {
      const result = {
        duplicates: [],
        totalDuplicates: 0,
        totalWastedSpace: 0,
        consolidationOpportunities: 0,
      };

      const summary = detector.getSummary(result);

      expect(summary).toContain('Found 0 duplicate packages');
    });
  });
});
