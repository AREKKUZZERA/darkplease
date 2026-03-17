# DARK PLEASE!

**DARK PLEASE!** is a browser extension that automatically generates dark themes for websites. It ships with a browser UI, content-script based page theming, configurable defaults, automation options, and multi-target build support for Chromium MV3, Firefox, and Thunderbird. :contentReference[oaicite:0]{index=0}

## Overview

DARK PLEASE! injects dark mode behavior into web pages and exposes extension UI through a popup/options page. The source tree includes dedicated modules for background logic, content injection, configuration, UI, generators, utilities, icons, and localization. The repository also contains build tooling, tests, and a small docs section for internal config formats. :contentReference[oaicite:1]{index=1}

## Features

- **Automatic dark mode for websites** with configurable theme defaults. :contentReference[oaicite:2]{index=2}
- **Configurable theme parameters** including brightness, contrast, grayscale, sepia, font settings, text stroke, scrollbar color, selection color, dark/light scheme colors, and theme engine selection. :contentReference[oaicite:3]{index=3}
- **Site-specific behavior** via built-in custom themes for selected sites and separate enabled/disabled site lists in default settings. :contentReference[oaicite:4]{index=4}
- **Automation support** with time-based and system-based behavior in settings defaults. :contentReference[oaicite:5]{index=5}
- **Keyboard commands** for toggling the extension, toggling the current site, and switching theme generation mode. :contentReference[oaicite:6]{index=6}
- **Chrome MV3 popup/options UI** exposed through the extension action and options page. :contentReference[oaicite:7]{index=7}
- **Cross-target manifests** for Chromium, Firefox, and Thunderbird builds. :contentReference[oaicite:8]{index=8}

## Project Structure

```text
.
├── docs/
├── integrity/
├── src/
│   ├── _locales/
│   ├── api/
│   ├── background/
│   ├── config/
│   ├── generators/
│   ├── icons/
│   ├── inject/
│   ├── stubs/
│   ├── ui/
│   ├── utils/
│   ├── defaults.ts
│   ├── definitions.d.ts
│   ├── manifest.json
│   ├── manifest-chrome-mv3.json
│   ├── manifest-firefox.json
│   └── manifest-thunderbird.json
├── tasks/
├── tests/
├── package.json
└── README.md
````

This layout indicates a fairly standard extension architecture:

* `src/background` for extension background logic
* `src/inject` for page injection/content scripts
* `src/ui` for popup/options interface
* `src/generators` for theme generation logic
* `src/config` and `src/defaults.ts` for default behavior and config formats
* `tasks` for the custom build pipeline
* `tests` for unit, browser, and injection testing ([GitHub][1])

## Build Targets

The repository includes support for multiple output targets:

* **Chromium Manifest V3**
* **Firefox Manifest V2**
* **Thunderbird**
* **API/library build** for packaging as a separate artifact ([GitHub][1])

The Chrome MV3 manifest defines:

* an extension action popup
* an options UI page
* a background service worker
* injected scripts running at `document_start` and `document_idle`
* permissions such as `alarms`, `fontSettings`, `scripting`, and `storage`
* broad host permissions for web page coverage ([GitHub][2])

## Requirements

* **Node.js**
* **npm**

The project uses TypeScript, Rollup, Less, Jest, Karma, ESLint, and Malevic. These are declared in `package.json` dependencies and devDependencies. ([GitHub][3])

## Installation

Install dependencies:

```bash
npm install
```

Run a development build for Chrome MV3:

```bash
npm run debug
```

Build a release bundle for Chrome MV3:

```bash
npm run build
```

Additional supported build commands include Firefox, plus builds, API builds, and watch/debug variants. ([GitHub][4])

## Available Scripts

### Development

```bash
npm run debug
npm run debug:watch
npm run debug:watch:mv3
npm run debug:watch:plus
```

### Production builds

```bash
npm run build
npm run build:all
npm run build:firefox
npm run build:plus
npm run api
npm run release
```

### Quality and testing

```bash
npm run lint
npm run test
npm run test:all
npm run test:browser
npm run test:chrome
npm run test:chrome-mv3
npm run test:firefox
npm run test:inject
npm run test:coverage
```

These scripts are declared directly in `package.json`. ([GitHub][3])

## Loading the Extension Locally

After building, load the unpacked extension from the generated build output in your browser’s extensions page.

For Chromium browsers:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the appropriate generated build directory

The exact output folder naming is controlled by the custom build pipeline under `tasks/`. The repo’s build entry point is `tasks/cli.js`, which delegates to the project build system and supports flags such as `--chrome-mv3`, `--firefox`, `--release`, `--debug`, and `--watch`. ([GitHub][5])

## Configuration

Default behavior is defined in `src/defaults.ts`. Out of the box, the project includes:

* dark and light default color pairs
* a default theme object with engine, color, font, and rendering preferences
* built-in site-specific filter-mode themes for selected productivity domains
* automation defaults
* time-based activation/deactivation defaults
* toggles for syncing settings, PDF support, protected pages, context menus, and dark theme detection ([GitHub][6])

The repo also contains a documented spec for `src/config/color-schemes.drconf`, describing how custom light/dark color scheme sections are structured. ([GitHub][7])

## Testing

Testing is organized into several areas:

* `tests/unit`
* `tests/browser`
* `tests/inject`
* `tests/support` ([GitHub][8])

The project uses:

* **Jest** for unit and browser-oriented test flows
* **Karma** for injection tests ([GitHub][3])

## Tech Stack

* **TypeScript**
* **JavaScript**
* **Less**
* **Malevic** for UI rendering
* **Rollup** for bundling
* **Jest** and **Karma** for testing
* **ESLint** for linting ([GitHub][4])

## Repository Metadata

* **Repository:** `AREKKUZZERA/darkplease`
* **License:** MIT
* **Homepage:** GitHub repository
* **Issues:** GitHub Issues
* **Current public releases:** none published on the repository page at the time of inspection ([GitHub][4])