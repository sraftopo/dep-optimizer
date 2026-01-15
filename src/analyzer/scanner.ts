import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface PackageInfo {
  name: string;
  version: string;
  path: string;
  size?: number;
  dependencies?: Record<string, string>;
  /** Dependency level: 0 = direct dependency, 1+ = transitive dependency */
  level?: number;
}

export interface ScanResult {
  packages: PackageInfo[];
  totalSize: number;
  scannedPaths: string[];
}

export class DependencyScanner {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<ScanResult> {
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error(`node_modules not found at ${nodeModulesPath}. Run 'npm install' first.`);
    }

    // Read root package.json to identify direct dependencies
    const rootPackageJsonPath = path.join(this.projectRoot, 'package.json');
    const directDependencies = new Set<string>();
    
    if (fs.existsSync(rootPackageJsonPath)) {
      try {
        const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf-8'));
        const allDeps = {
          ...rootPackageJson.dependencies,
          ...rootPackageJson.devDependencies,
          ...rootPackageJson.peerDependencies,
          ...rootPackageJson.optionalDependencies,
        };
        Object.keys(allDeps).forEach(dep => directDependencies.add(dep.toLowerCase()));
      } catch (error) {
        // Ignore errors reading root package.json
      }
    }

    const packages: PackageInfo[] = [];
    const scannedPaths: string[] = [];
    let totalSize = 0;

    const packageJsonFiles = await glob('**/package.json', {
      cwd: nodeModulesPath,
      ignore: ['**/node_modules/**/node_modules/**'],
      absolute: true,
    });

    for (const packageJsonPath of packageJsonFiles) {
      try {
        const packageInfo = await this.readPackageInfo(packageJsonPath, nodeModulesPath, directDependencies);
        if (packageInfo) {
          packages.push(packageInfo);
          scannedPaths.push(packageInfo.path);
          totalSize += packageInfo.size || 0;
        }
      } catch (error) {
        console.warn(`Warning: Could not read package at ${packageJsonPath}:`, error);
      }
    }

    return {
      packages,
      totalSize,
      scannedPaths,
    };
  }

  private async readPackageInfo(
    packageJsonPath: string,
    nodeModulesPath: string,
    directDependencies: Set<string>
  ): Promise<PackageInfo | null> {
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (!packageJson.name || !packageJson.version) {
        return null;
      }

      const packageDir = path.dirname(packageJsonPath);
      const size = await this.calculateDirectorySize(packageDir);

      // Calculate dependency level
      // Level 0: Direct dependency (in root package.json)
      // Level 1+: Transitive dependency (nested in node_modules)
      let level = 0;
      
      // Check if it's a direct dependency first
      if (directDependencies.has(packageJson.name.toLowerCase())) {
        level = 0;
      } else {
        // Calculate depth based on path structure
        // node_modules/package-name = level 0
        // node_modules/package-name/node_modules/another-package = level 1+
        const relativePath = path.relative(nodeModulesPath, packageDir);
        const pathParts = relativePath.split(path.sep);
        
        // Count how many node_modules directories are in the path
        let nodeModulesCount = 0;
        for (let i = 0; i < pathParts.length; i++) {
          if (pathParts[i] === 'node_modules') {
            nodeModulesCount++;
          }
        }
        
        // If directly in node_modules, it's level 0 (but not in package.json, so might be hoisted)
        // If nested, calculate level based on depth
        if (nodeModulesCount === 0) {
          level = 0; // Directly in node_modules (might be hoisted)
        } else {
          level = nodeModulesCount; // Each nested node_modules increases the level
        }
      }

      return {
        name: packageJson.name,
        version: packageJson.version,
        path: packageDir,
        size,
        dependencies: packageJson.dependencies || {},
        level,
      };
    } catch (error) {
      return null;
    }
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules') {
            totalSize += await this.calculateDirectorySize(fullPath);
          }
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }

    return totalSize;
  }

  async scanPackage(packageName: string): Promise<PackageInfo[]> {
    const result = await this.scan();
    return result.packages.filter(pkg => pkg.name === packageName);
  }

  getProjectRoot(): string {
    return this.projectRoot;
  }
}
