# DARK PLEASE! 2.5.2

## Fixed

- Prevent theme injection on local `file:` pages.
- Detect native dark themes before applying extension styles to avoid a visible flash on already-dark sites.
- Improve dark-theme detection for pages that advertise `color-scheme: light dark` but need real page colors checked.
- Treat common dark-mode classes and attributes as dark only when the computed page colors are also dark.
- Migrate deprecated TypeScript compiler options before TypeScript 7.0 removes support for them.

## Changed

- Use `moduleResolution: bundler` in source and browser/injection test TypeScript configs.
- Replace `baseUrl`-dependent stub imports with explicit relative imports.
- Raise browser test type-checking libs to ES2022 for current shared utility usage.

## Validation

- `npx tsc --project src/tsconfig.json --pretty false`
- `npx tsc --project tests/inject/tsconfig.json --pretty false`
- `npx tsc --project tests/browser/tsconfig.json --pretty false`
