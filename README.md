<p align="center">
  <img src="./src/ui/assets/images/darkplease-type.svg" alt="DARK PLEASE!" width="260" />
</p>

<p align="center">
  <b>Automatic dark mode for websites, with native dark-theme detection and per-site control.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/AREKKUZZERA/darkplease?style=for-the-badge&color=111111" alt="Latest release" />
  <img src="https://img.shields.io/badge/license-MIT-111111?style=for-the-badge" alt="MIT license" />
  <img src="https://img.shields.io/badge/Chrome-MV3-111111?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome MV3" />
</p>

---

## Overview

**DARK PLEASE!** is a browser extension that generates dark themes for websites automatically. It is based on the Dark Reader engine family and adds a custom popup UI, per-site controls, automation, bundled site fixes, and stronger handling for websites that already provide a native dark theme.

The extension tries to avoid fighting a website's own dark mode. It checks page color-scheme metadata, CSS `color-scheme`, dark-mode markers, and visible page samples before deciding whether to inject a generated theme.

## Features

- Dynamic dark theme generation for websites without native dark mode.
- Native dark-theme detection to avoid double-darkening sites such as Google Search or SoundCloud.
- Per-site enable/disable lists and per-site custom theme presets.
- Theme controls for brightness, contrast, grayscale, sepia, blue light, fonts, text stroke, scrollbars, and selection colors.
- Automation by time, location-like schedule settings, and system color scheme.
- Keyboard shortcuts for global toggle, current-site toggle, and generation mode switching.
- Rendering engines: Dynamic Theme, CSS Filter, SVG Filter, and Static Theme.
- Bundled config files for dark sites, detector hints, inversion fixes, dynamic theme fixes, static themes, and color schemes.
- Popup, options page, devtools editors, and import/export for settings.

## Getting Started

```bash
git clone https://github.com/AREKKUZZERA/darkplease.git
cd darkplease
npm install
```

Create a debug build:

```bash
npm run debug
```

Create a release build:

```bash
npm run build
```

Load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the generated Chrome build directory.

## Scripts

```bash
# Build
npm run debug
npm run build
npm run build:all
npm run build:firefox
npm run release

# Watch builds
npm run debug:watch
npm run debug:watch:mv3

# Checks
npm run lint
npm run test
npm run test:unit
npm run test:browser
npm run test:inject
npm run test:coverage

# Config maintenance
npm run config-cleanup
```

## Project Structure

```text
src/
  background/     extension state, tab management, config loading
  config/         bundled site rules and color scheme data
  generators/     theme engines and config parsers
  inject/         content script, detector, theme injection, DOM watchers
  ui/             popup, options, devtools, shared UI assets
  utils/          shared helpers

tests/
  browser/        browser-level checks
  inject/         content-script and URL behavior tests
  unit/           parser, config, validation, and utility tests

tasks/            build, release, config, and maintenance scripts
docs/             project notes and supporting documentation
integrity/        extension integrity assets
```

## Theme Detection

The detector is designed to be conservative:

- Respect explicit dark `color-scheme` declarations.
- Treat `color-scheme: dark light` as dark when dark is the active first scheme.
- Respect system-driven dark metadata when the system preference is dark.
- Look for common dark-mode classes and attributes.
- Sample visible page backgrounds instead of relying on a single element.
- Disable DARK PLEASE! styles during detection so generated styles do not contaminate the result.

This keeps sites with native dark themes stable while still allowing DARK PLEASE! to generate a theme for light-only pages.

## Acknowledgements

Derived from [Dark Reader](https://github.com/darkreader/darkreader). Original work is copyright Dark Reader contributors and licensed under MIT. This repository contains UI changes, extension behavior changes, bundled configuration, and project-specific modifications built on top of that foundation.
