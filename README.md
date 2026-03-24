<p align="center">
  <img src="./src/ui/assets/images/darkplease-type.svg" alt="DARK PLEASE!" width="260" />
</p>

<p align="center">
  <b>Browser extension that automatically generates dark themes for websites.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/AREKKUZZERA/darkplease?style=for-the-badge&color=111111" />
  <img src="https://img.shields.io/badge/license-MIT-111111?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Chrome-111111?style=for-the-badge&logo=googlechrome&logoColor=white" />
</p>

---

**DARK PLEASE!** applies dark mode to any website automatically using dynamic theme generation. The extension ships with a fully custom UI, per-site controls, automation, keyboard shortcuts, and deep theme customization — all without requiring website-specific configuration.

## Features

- Dynamic dark theme generation for any website
- Per-site enable/disable and custom theme rules
- Theme controls: brightness, contrast, grayscale, sepia, font, text stroke, scrollbar, selection colors
- Automation: time-based and system color scheme aware
- Keyboard shortcuts for toggle, site toggle, and mode switch
- Multiple rendering engines: Dynamic, CSS Filter, SVG Filter, Static

## Stack

TypeScript · Malevic · Less · Rollup · Jest · Karma · ESLint

## Build Targets

Chrome MV3

## Getting Started

```bash
git clone https://github.com/AREKKUZZERA/darkplease.git
cd darkplease
npm install

npm run debug        # development build
npm run build        # production build
```

To load locally in Chrome: open `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the build folder.

## Scripts

```bash
# Dev
npm run debug:watch
npm run debug:watch:mv3

# Production
npm run build:all
npm run build:firefox
npm run release

# Test & Lint
npm run lint
npm run test
npm run test:browser
npm run test:inject
npm run test:coverage
```

## Project Structure

```
src/
├── background/     # service worker, config, tab management
├── inject/         # dynamic theme injection into pages
├── generators/     # theme engines (dynamic, filter, svg, static)
├── ui/             # popup, options, devtools UI
├── config/         # bundled site fixes and color schemes
└── utils/          # shared utilities
tests/
├── browser/        # e2e browser tests (Jest + Karma)
├── inject/         # injection logic tests
└── unit/           # unit tests
```

## Acknowledgements

Derived from **[Dark Reader](https://github.com/darkreader/darkreader)** — original work © Dark Reader contributors (MIT License). This repository contains UI changes, modifications, and additional features built on top of the original codebase.
