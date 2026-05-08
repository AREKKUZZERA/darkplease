# DARK PLEASE! 2.5.2

## Fixed

- Prevent theme injection on local `file:` pages.
- Detect native dark themes before applying extension styles to avoid a visible flash on already-dark sites.
- Improve dark-theme detection for pages that advertise `color-scheme: light dark` but need real page colors checked.
- Treat common dark-mode classes and attributes as dark only when the computed page colors are also dark.

## Validation

- `npm run lint`
- `npm run test:unit -- --runInBand`
- `npm run build`
