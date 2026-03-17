<h1 align="center">🌙 DARK PLEASE!</h1>

<p align="center">
  <b>Browser extension that automatically generates dark themes for websites.</b>
</p>

<p align="center">
<img src="https://img.shields.io/github/v/release/AREKKUZZERA/darkplease?style=for-the-badge&color=8A2BE2" />
  <img src="https://img.shields.io/badge/license-MIT-111111?style=for-the-badge" />
  <img src="https://img.shields.io/badge/platform-Chrome%20MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" />
</p>

---

## ✨ Overview

**DARK PLEASE!** is a browser extension that applies dark mode to websites automatically.  
It includes a full extension UI, configurable theme behavior, automation settings, site list management, hotkeys, and advanced customization options.

Designed for comfort, control, and a cleaner browsing experience.

---

## 🚀 Features

- 🌑 Automatic dark theme generation for websites
- ⚙️ Flexible settings and theme customization
- 📋 Site list management for per-site behavior
- ⏰ Automation support
- ⌨️ Keyboard shortcuts
- 🎛️ Advanced rendering and appearance controls
- 🧩 Multi-platform extension targets

---

## 🛠️ Tech Stack

### Core

<p align="left">
  <img src="https://skillicons.dev/icons?i=ts" width="42" height="42" />
  <img src="https://skillicons.dev/icons?i=js" width="42" height="42" />
  <img src="https://skillicons.dev/icons?i=nodejs" width="42" height="42" />
</p>

TypeScript · JavaScript · Node.js

---

### UI & Styling

<p align="left">
  <img src="https://skillicons.dev/icons?i=html" width="42" height="42" />
  <img src="https://skillicons.dev/icons?i=css" width="42" height="42" />
  <img src="https://skillicons.dev/icons?i=less" width="42" height="42" />
</p>

Malevic · Less · Custom UI components

---

### Tooling & Quality

<p align="left">
  <img src="https://skillicons.dev/icons?i=rollupjs" width="42" height="42" />
  <img src="https://skillicons.dev/icons?i=jest" width="42" height="42" />
  <img src="https://skillicons.dev/icons?i=eslint" width="42" height="42" />
</p>

Rollup · Jest · Karma · ESLint

---

## 📦 Project Structure

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
```

---

## ⚡ Highlights

### 🎨 Theme Customization

Adjust:

- brightness
- contrast
- grayscale
- sepia
- font settings
- text stroke
- scrollbar color
- selection color
- dark / light scheme colors
- theme engine behavior

### 🌐 Site-Specific Control

Manage behavior for selected websites with:

- enabled / disabled lists
- custom site rules
- per-site theme behavior

### ⏱ Automation

Supports configurable automation options, including time-based behavior and system-aware settings.

### ⌨️ Commands

Keyboard shortcuts are available for:

- toggling the extension
- toggling the current site
- switching theme mode

---

## 🧱 Build Targets

DARK PLEASE! supports multiple extension targets:

- <img src="https://cdn.simpleicons.org/googlechrome/4285F4" width="16" height="16" /> Chromium Manifest V3

---

## 📥 Installation

### From source

```bash
git clone https://github.com/AREKKUZZERA/darkplease.git
cd darkplease
npm install
```

### Development build

```bash
npm run debug
```

### Production build

```bash
npm run build
```

---

## 🧪 Available Scripts

### Development

```bash
npm run debug
npm run debug:watch
npm run debug:watch:mv3
npm run debug:watch:plus
```

### Production

```bash
npm run build
npm run build:all
npm run build:firefox
npm run build:plus
npm run api
npm run release
```

### Testing & Linting

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

---

## 🧭 Load Extension Locally

### Chrome / Chromium

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the generated build folder

---

## ⚙️ Configuration

Default configuration includes:

- theme presets
- dark and light color schemes
- automation defaults
- site list defaults
- PDF support options
- context menu toggles
- sync behavior
- protected page settings
- dark theme detection settings

---

## 🧪 Testing

The repository includes multiple test areas:

- `tests/unit`
- `tests/browser`
- `tests/inject`
- `tests/support`

This keeps both UI behavior and injection logic covered.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

Issues, suggestions, and pull requests are welcome.

<p align="center">
  <a href="https://github.com/AREKKUZZERA/darkplease/issues">
    <img src="https://img.shields.io/badge/Issues-Open-111111?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://github.com/AREKKUZZERA/darkplease/pulls">
    <img src="https://img.shields.io/badge/Pull%20Requests-Welcome-8A2BE2?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</p>
