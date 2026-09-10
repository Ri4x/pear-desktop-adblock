# Pear Desktop Adblock 🎵

A customized fork of [Pear Desktop](https://github.com/pear-devs/pear-desktop) with integrated ad blocking and UI cleanup plugins, built following the project's official plugin architecture.

## 🌟 Credits & Acknowledgments

This project is made possible thanks to:

- **[pear-devs/pear-desktop](https://github.com/pear-devs/pear-desktop)** — The continuation and fork upon which this repository is built, providing the official plugin system.
- **[th-ch/youtube-music](https://github.com/th-ch/youtube-music)** — The original upstream project, creator of the Electron wrapper and plugin architecture (`src/plugins/NAME/index.ts`).
- **[ghostery/adblocker](https://github.com/ghostery/adblocker)** (`@ghostery/adblocker-electron`) — The ad and tracker blocking engine (EasyList/EasyPrivacy) powering the `adblocker` plugin in this fork.

Both upstream projects are licensed under the **MIT License**. This fork retains the same license — see [`license`](./license).

### ⚠️ Disclaimer

Like Pear Desktop and th-ch/youtube-music, this fork has no affiliation with Google LLC or YouTube. It is an independent, non-profit open-source project intended for personal use.

---

## 🧩 Plugins Added in this Fork

### 🛡️ `adblocker`

Network-level and content-level blocking for ads and tracking scripts using `@ghostery/adblocker-electron`.

- **Singleton Engine**: The blocker engine runs as a singleton (`blocker.ts`) with session tracking to prevent calling `enableBlockingInSession` multiple times on the same session.
- **`restartNeeded: true` by design**: Disabling the blocker on an active session is avoided due to a known upstream issue ([ghostery/adblocker#2437](https://github.com/ghostery/adblocker/issues/2437)) where tearing down IPC listeners can break user input handling in `webContents`. Full cleanup via `disableForSession` is only invoked during `stop()` when closing the application.
- **Cosmetic Filtering**: Element hiding is handled natively by the engine via `blocker.config.loadCosmeticFilters`, configured prior to enabling session blocking.

### 🚫 `hide-premium-promo`

Hides the "Upgrade" (Premium promo) entry from the sidebar navigation menu. Since it lacks a distinct CSS class, it dynamically matches the visible localized text (`actualizar` / `upgrade`) and maintains state using a lightweight `MutationObserver`.

---

## 📌 Known Notes

- **Top Bar Overlay**: During initial plugin loading, a minor visual clipping/overlap may be noticed in the title/search/navigation area. This occurs in both development mode and production builds without affecting plugin functionality.
- **Language Selector**: The language picker (Options → Language) displays "Unknown (Unknown)" for certain locales — this is an inherited upstream table issue and unrelated to the plugins in this fork.

---

## 🛠️ Build & Development

### Development Mode

```bash
# Run in development mode with live watch
.\node_modules\.bin\electron-vite dev --watch
```

### Packaging for Windows

```bash
# Clean, compile, and build installer & portable binaries
.\node_modules\.bin\del-cli dist pack .vite-inspect
.\node_modules\.bin\electron-vite build
.\node_modules\.bin\electron-builder --win -p never
```

The installer and portable executable will be generated inside the `pack/` directory.
