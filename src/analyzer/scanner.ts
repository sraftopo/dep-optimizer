import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface PackageInfo {
  name: string;
  version: string;
  path: string;
  size?: number;
  dependencies?: Record<string, string>;
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
        const packageInfo = await this.readPackageInfo(packageJsonPath);
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

  private async readPackageInfo(packageJsonPath: string): Promise<PackageInfo | null> {
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (!packageJson.name || !packageJson.version) {
        return null;
      }

      const packageDir = path.dirname(packageJsonPath);
      const size = await this.calculateDirectorySize(packageDir);

      return {
        name: packageJson.name,
        version: packageJson.version,
        path: packageDir,
        size,
        dependencies: packageJson.dependencies || {},
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
