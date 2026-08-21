 # DeckMaster

DeckMaster is a desktop application built with [Electron](https://www.electronjs.org/). It is designed to provide a streamlined desktop environment for creating and managing trading card game decks across platforms.

## Features

- Runs as a native desktop application using Electron
- Organize and manage card decks
- Cross-platform development and distribution

## Contributions
I am not currently accepting pull requests, as this is a solo project for developing my skills with Electron.

## Building

Use the package script configured by the project to create a distributable application:

```bash
npm run build
```

## Project Structure

The application follows the standard Electron model:

- **Main process** — Creates the application window and manages native desktop functionality.
- **Renderer process** — Provides the user interface for working with decks and cards.

The source is organized by runtime and responsibility:

- `src/index.js` — Main-process composition root and application lifecycle.
- `src/main/` — Main-process stores, IPC registration, context menu, card images, and PDF export.
- `src/renderer.js` — Renderer bootstrap, navigation, and cross-view coordination.
- `src/renderer/` — Import, deck list, card table, and settings view modules.
- `src/classes/` and `src/utils/` — Shared deck/preferences models and deck/card utilities.

## License

No license has been specified yet.
