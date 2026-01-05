# Release Notes - v0.0.1

## 🎉 First Release: dep-optimizer

**Release Date**: January 5, 2026

We're excited to announce the first release of **dep-optimizer** - a powerful CLI tool to analyze, detect, and optimize duplicate dependencies in your Node.js projects!

## 🚀 What is dep-optimizer?

dep-optimizer helps you take control of your `node_modules` folder by:
- Finding duplicate packages across different versions
- Calculating exactly how much disk space is wasted
- Recommending which duplicates can be safely consolidated
- Providing actionable insights to optimize your dependency tree

## ✨ Key Features

### 📊 Four Powerful Commands

1. **`dep-optimizer scan`**
   - Scan your entire dependency tree
   - View total package count and disk space usage
   - Get a complete overview of your project's dependencies

2. **`dep-optimizer duplicates`**
   - Find all duplicate packages in your project
   - See wasted disk space per duplicate
   - Get smart recommendations for consolidation
   - Filter by minimum wasted space threshold

3. **`dep-optimizer analyze`**
   - Complete analysis in one command
   - Combines scanning and duplicate detection
   - Perfect for regular dependency audits

4. **`dep-optimizer check <package>`**
   - Check a specific package for duplicates
   - Quick investigation of single dependencies
   - See all versions and their exact locations

### 🎯 Smart Analysis

- **Semver Intelligence**: Uses semantic versioning to detect which duplicates can be safely consolidated
- **Accurate Calculations**: Precise disk space analysis for every package
- **Prioritized Results**: Duplicates sorted by wasted space (biggest offenders first)
- **Consolidation Recommendations**: Clear guidance on which version to standardize on

### 🎨 Beautiful Output

- **Color-coded terminal output** for easy reading
- **JSON export** for CI/CD pipelines and automation
- **Verbose mode** for detailed debugging
- **Path display** to see exact file locations
- **Progress indicators** for long-running scans

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

```bash
# Navigate to your project
cd your-project

# Run a full analysis
dep-optimizer analyze

# Find duplicates only
dep-optimizer duplicates

# Check a specific package
dep-optimizer check lodash
```

## 📖 Example Output

```
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

📊 Summary

Total duplicate packages: 12
Potential space savings: 8.54 MB
Auto-consolidatable packages: 3

💡 Recommendation:
Update your package.json to use compatible version ranges.
Run "npm dedupe" after updating to remove duplicates.
```

## 🛠️ Use Cases

### Development
- **Pre-commit checks**: Ensure no new duplicates are introduced
- **Code reviews**: Analyze dependency changes in PRs
- **Local optimization**: Clean up your development environment

### CI/CD
- **Automated audits**: Run `dep-optimizer --json` in your pipeline
- **Size budgets**: Fail builds if wasted space exceeds threshold
- **Dependency reports**: Generate reports for each deployment

### Production
- **Bundle optimization**: Reduce final bundle sizes
- **Installation speed**: Fewer duplicates = faster npm install
- **Disk space**: Save space in containers and deployments

## 📦 What's Included

### Core Modules
- **Scanner**: Recursive node_modules analysis
- **Duplicate Detector**: Smart duplicate identification with semver
- **Reporter**: Beautiful CLI output and JSON export

### Testing
- **13 comprehensive tests** covering all core functionality
- **100% passing** test suite
- **Jest** for reliable testing

### Documentation
- **Detailed README** with examples and use cases
- **Command reference** for all CLI options
- **Integration guide** for CI/CD pipelines
- **Contributing guidelines** for open source collaboration

## 🎓 Technical Stack

- **TypeScript 5.3+** for type safety and developer experience
- **Commander.js 11** for robust CLI handling
- **Chalk 4** for beautiful terminal colors
- **Semver 7** for version analysis
- **Glob 10** for fast file matching
- **Jest 29** for comprehensive testing

## 🔧 Requirements

- **Node.js**: 16.0.0 or higher
- **npm**: Any recent version
- **Platform**: Linux, macOS, Windows

## 🎯 Real-World Impact

In our own project with 435 packages:
- Detected **27 duplicate packages**
- Identified **1.51 MB** of wasted space
- Found **1 package** ready for automatic consolidation

## 📚 Learn More

- **Full Documentation**: See [README.md](README.md)
- **Changelog**: See [CHANGELOG.md](CHANGELOG.md)
- **GitHub Repository**: [github.com/sraftopo/dep-optimizer](https://github.com/sraftopo/dep-optimizer)

## 🤝 Contributing

We welcome contributions! Please check out our repository to:
- Report bugs
- Request features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - Free to use in personal and commercial projects

---

## 🙏 Thank You

Thank you for trying dep-optimizer! We hope it helps you build faster, leaner Node.js applications.

If you find it useful, please:
- ⭐ Star the repository
- 🐦 Share with your team
- 🐛 Report any issues you find
- 💡 Suggest new features

**Happy optimizing!** 🚀
