# Changelog

## Unreleased

### Fixed

- Improved native dark-theme detection so DARK PLEASE! is less likely to inject a generated theme into websites that already render dark UI.
- Treated active `color-scheme: dark light` declarations as native dark mode.
- Made visible-page sampling more stable by comparing dark and light samples instead of failing on the first light element.
- Guarded dark-theme detection callbacks so one detector run can only apply one result.

### Documentation

- Refreshed `README.md` for the current extension behavior, Chrome MV3 target, supported engines, project structure, scripts, and detector strategy.

### Validation

- Ran `npx tsc -p src\tsconfig.json --noEmit`.
- Ran `npx eslint src\inject\detector.ts`.
