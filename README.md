# 📦 dep-optimizer

> Smart dependency analyzer and optimizer for Node.js projects - Slash your bundle size, eliminate duplicates, and optimize your dependency tree with zero configuration.

[![npm version](https://badge.fury.io/js/dep-optimizer.svg)](https://badge.fury.io/js/dep-optimizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Why dep-optimizer?

Are duplicate dependencies bloating your `node_modules` folder? Is your bundle size out of control? **dep-optimizer** is your go-to CLI tool for keeping your Node.js projects lean, fast, and optimized.

### The Problem

- **Bloated bundles**: Duplicate packages waste disk space and slow down installations
- **Conflicting versions**: Different dependencies pulling in incompatible versions of the same package
- **Hidden costs**: You don't know which duplicates are costing you the most space
- **Manual detective work**: Finding and fixing duplicates is tedious and error-prone

### The Solution

dep-optimizer automatically scans your entire dependency tree, identifies duplicates, calculates wasted space, and provides actionable recommendations to consolidate your dependencies.

## ✨ Features

- **🔍 Deep Scanning**: Recursively analyzes your entire `node_modules` tree
- **🎯 Duplicate Detection**: Identifies all duplicate packages across different versions
- **💾 Space Analysis**: Calculates exact wasted space from duplicate dependencies
- **🤖 Smart Consolidation**: Detects which duplicates can be safely consolidated using semver
- **📊 Beautiful Reports**: Color-coded, easy-to-read CLI output
- **⚡ Lightning Fast**: Optimized scanning with minimal overhead
- **🛠️ Zero Config**: Works out of the box with any Node.js project
- **📈 JSON Export**: Machine-readable output for CI/CD integration
- **🎨 Rich CLI**: Multiple commands for different use cases

## 📥 Installation

### Global Installation (Recommended)

```bash
npm install -g dep-optimizer
```

### Local Installation

```bash
npm install --save-dev dep-optimizer
```

### Run Without Installing

```bash
npx dep-optimizer analyze
```

## 🎯 Quick Start

Navigate to your Node.js project and run:

```bash
# Full analysis (scan + duplicates)
dep-optimizer analyze

# Just scan dependencies
dep-optimizer scan

# Find duplicate dependencies
dep-optimizer duplicates

# Check a specific package
dep-optimizer check lodash
```

## 📖 Usage

### Full Analysis

Get a complete overview of your dependencies and duplicates:

```bash
dep-optimizer analyze
```

**Output:**
```
📦 Dependency Scan Results

Total packages: 842
Total size: 156.43 MB
Scanned paths: 842

🔍 Duplicate Package Analysis

Found 12 duplicate packages
Total wasted space: 8.54 MB
3 packages can be consolidated

lodash
──────────────────────────────────────────────────
Versions found: 3
Total instances: 5
Wasted space: 3.21 MB
✓ Can consolidate to version 4.17.21
```

### Scan Dependencies

View all installed dependencies and their sizes:

```bash
dep-optimizer scan
```

### Find Duplicates

Analyze only duplicate dependencies:

```bash
dep-optimizer duplicates
```

**Advanced options:**

```bash
# Show file paths for each duplicate
dep-optimizer duplicates --show-paths

# Only show duplicates wasting more than 1MB
dep-optimizer duplicates --min-waste 1048576

# Verbose output
dep-optimizer duplicates --verbose

# JSON output for automation
dep-optimizer duplicates --json
```

### Check Specific Package

Inspect a single package for duplicates:

```bash
dep-optimizer check react
```

**Output:**
```
Found 2 versions of react:
  - 17.0.2 (1 instances)
  - 18.2.0 (1 instances)

✓ Can consolidate to version 18.2.0
```

## 🎨 Command Reference

| Command | Description | Options |
|---------|-------------|---------|
| `analyze` | Complete analysis: scan + duplicates | `-p, --path`, `-v, --verbose`, `--json`, `--show-paths` |
| `scan` | Scan all dependencies | `-p, --path`, `-v, --verbose`, `--json` |
| `duplicates` | Find duplicate dependencies | `-p, --path`, `-v, --verbose`, `--json`, `--show-paths`, `--min-waste` |
| `check <package>` | Check specific package for duplicates | `-p, --path`, `-v, --verbose`, `--json`, `--show-paths` |

### Global Options

- `-p, --path <path>`: Specify project path (default: current directory)
- `-v, --verbose`: Enable verbose output
- `--json`: Output results in JSON format
- `--show-paths`: Display file paths for each version
- `--min-waste <bytes>`: Minimum wasted space threshold

## 💡 Practical Examples

### Find the Biggest Space Wasters

```bash
dep-optimizer duplicates --min-waste 1000000
```

This shows only duplicates wasting over 1MB of space.

### Analyze a Different Project

```bash
dep-optimizer analyze --path /path/to/project
```

### CI/CD Integration

```bash
# Export to JSON and parse in your CI pipeline
dep-optimizer duplicates --json > duplicates-report.json

# Fail CI if duplicates waste more than 10MB
dep-optimizer duplicates --json | jq '.totalWastedSpace > 10485760' | grep -q true && exit 1
```

### Debug Specific Package

```bash
dep-optimizer check axios --show-paths --verbose
```

## 🔧 How It Works

1. **Scanning**: Recursively walks through `node_modules` and reads all `package.json` files
2. **Analysis**: Groups packages by name and identifies multiple versions
3. **Size Calculation**: Computes actual disk space used by each package
4. **Semver Check**: Uses semantic versioning to determine if versions can be consolidated
5. **Reporting**: Generates beautiful, actionable reports

## 🎯 After Finding Duplicates

### Step 1: Update package.json

Review the consolidation recommendations and update your `package.json` to use compatible version ranges:

```json
{
  "dependencies": {
    "lodash": "^4.17.21"  // Use latest compatible version
  }
}
```

### Step 2: Deduplicate

Run npm's built-in deduplication:

```bash
npm dedupe
```

### Step 3: Verify

Check that duplicates are gone:

```bash
dep-optimizer duplicates
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/sraftopo/dep-optimizer.git

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run linter
npm run lint
```

## 📊 Example Output

```
🔍 Duplicate Package Analysis

Found 8 duplicate packages
Total wasted space: 12.34 MB
5 packages can be consolidated

lodash
──────────────────────────────────────────────────
Versions found: 3
Total instances: 7
Wasted space: 4.12 MB
✓ Can consolidate to version 4.17.21

Versions:
  4.17.19 (2 instances, 1.37 MB)
  4.17.20 (3 instances, 1.38 MB)
  4.17.21 (2 instances, 1.37 MB)

📊 Summary

Total duplicate packages: 8
Potential space savings: 12.34 MB
Auto-consolidatable packages: 5

💡 Recommendation:
Update your package.json to use compatible version ranges for the consolidatable packages.
Run "npm dedupe" after updating to remove duplicates.
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript for type safety
- Powered by Commander.js for CLI
- Colored output with Chalk
- Semver analysis with node-semver

## 🐛 Issues

Found a bug? Have a feature request? [Open an issue](https://github.com/sraftopo/dep-optimizer/issues)!

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

---

**Made with ❤️ for the Node.js community**

If dep-optimizer saved you disk space and made your life easier, please give it a ⭐ on GitHub!
