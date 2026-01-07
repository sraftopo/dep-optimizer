# Features

This folder contains extra features, plugins, and extensions for the dep-optimizer library.

## Purpose

The `features/` folder is designed to house additional functionality that extends the core capabilities of dep-optimizer. This separation allows for:

- Modular feature development
- Easy addition of new features without cluttering the core analyzer code
- Clear organization of optional or experimental features
- Simplified maintenance and testing

## Structure

Each feature should be organized in its own subdirectory within this folder. For example:

```
features/
  ├── feature-name/
  │   ├── index.ts
  │   ├── types.ts
  │   └── README.md
  └── another-feature/
      └── ...
```

## Adding New Features

When adding a new feature:

1. Create a new subdirectory with a descriptive name (use kebab-case)
2. Implement your feature code within that directory
3. Add a `README.md` in the feature directory explaining:
   - What the feature does
   - How to use it
   - Any dependencies or requirements
4. Export the feature from an `index.ts` file if needed
5. Update the main CLI (`src/cli.ts`) to integrate the feature if it should be accessible via command-line

## Guidelines

- Keep features self-contained and well-documented
- Follow the same TypeScript and code style conventions as the main codebase
- Add appropriate tests in the `tests/` directory
- Consider backward compatibility when adding new features

