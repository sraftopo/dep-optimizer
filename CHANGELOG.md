# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-05

### 🎉 Initial Release

The first release of **dep-optimizer** - a smart dependency analyzer and optimizer for Node.js projects!

### ✨ Features

#### CLI Commands
- **`scan`** - Scan all dependencies in your project
  - Recursively analyzes entire `node_modules` tree
  - Calculates total package count and disk space usage
  - Shows scanned paths for transparency

- **`duplicates`** - Find and analyze duplicate dependencies
  - Detects packages installed in multiple versions
  - Calculates wasted disk space per duplicate
  - Identifies consolidation opportunities using semver
  - Provides version-specific recommendations

- **`analyze`** - Complete analysis combining scan and duplicate detection
  - One command to get full project overview
  - Perfect for auditing your dependency tree

- **`check <package>`** - Check specific package for duplicates
  - Quick way to investigate a single dependency
  - Shows all versions and their locations

#### Smart Analysis
- **Duplicate Detection**: Automatically finds packages installed in multiple versions
- **Semver Analysis**: Uses semantic versioning to determine if versions can be safely consolidated
- **Space Calculation**: Accurate calculation of disk space used and wasted
- **Consolidation Recommendations**: Tells you which duplicates can be automatically resolved
- **Version Ranking**: Suggests the best version to consolidate to

#### Output Options
- **Beautiful CLI Output**: Color-coded, easy-to-read terminal output with emojis
- **JSON Export**: Machine-readable output for CI/CD integration (`--json` flag)
- **Verbose Mode**: Detailed information with `--verbose` flag
- **Path Display**: Show exact file locations with `--show-paths` flag
- **Threshold Filtering**: Filter duplicates by minimum wasted space (`--min-waste`)

#### Developer Experience
- **Zero Configuration**: Works out of the box with any Node.js project
- **TypeScript**: Fully typed codebase for reliability
- **Comprehensive Tests**: 13 test cases covering core functionality
- **Multiple Install Options**: Global, local, or npx - your choice
- **Cross-platform**: Works on Linux, macOS, and Windows

### 📦 Package Information

- **Dependencies**:
  - `chalk@^4.1.2` - Colored terminal output
  - `commander@^11.1.0` - CLI framework
  - `glob@^10.3.10` - File pattern matching
  - `semver@^7.5.4` - Semantic versioning analysis

- **Dev Dependencies**: TypeScript, Jest, ESLint, and testing utilities

### 📊 Technical Details

- **Language**: TypeScript 5.3+
- **Node Version**: Requires Node.js 16.0.0 or higher
- **Test Coverage**: 13 passing tests
- **Module System**: CommonJS
- **Build System**: TypeScript compiler

### 📖 Documentation

- Comprehensive README with usage examples
- Command reference table
- Practical examples for common scenarios
- CI/CD integration guide
- Step-by-step duplicate resolution workflow

### 🎯 What's Next

This is the foundation release. Future versions may include:
- Automatic dependency consolidation
- Performance optimizations for large projects
- Additional output formats
- Integration with package managers
- Dependency tree visualization

### 🙏 Acknowledgments

Built with modern tools and best practices for the Node.js community.

---

**Installation**:
```bash
npm install -g dep-optimizer
```

**Quick Start**:
```bash
dep-optimizer analyze
```

For full documentation, see the [README](README.md).

[0.0.1]: https://github.com/sraftopo/dep-optimizer/releases/tag/v0.0.1
