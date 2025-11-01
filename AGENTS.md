# AI Agent Guide — MCP Server Manager

This comprehensive guide helps AI coding agents (GitHub Copilot, Cursor, Claude, Windsurf, etc.) work efficiently in this repository.

## Project Overview

MCP Server Manager is an Electron-based GUI application for starting/stopping, monitoring, logging, and exposing (via ngrok) MCP servers.

**Tech Stack:**

- Electron + React (MUI v7) + TypeScript 5
- Zustand (state management), i18next (i18n)
- Vite (dev server), electron-builder (distribution)
- yarn 4 + Node.js 22

## Development Workflow

### Setup

```bash
yarn install
yarn dev  # Development mode (main: tsc -w / renderer: vite@3001 / electron in parallel)
```

### Build/Distribution

```bash
yarn build        # TypeScript compile + Vite build
yarn start        # Production mode (HashRouter loading dist/renderer/index.html)
yarn dist:mac     # macOS distribution
yarn dist:win     # Windows distribution
yarn dist:linux   # Linux distribution
```

### Development Notes

- Development mode uses BrowserRouter at `http://localhost:3001`
- Production mode uses HashRouter loading `dist/renderer/index.html`
- DevTools open automatically in detached mode (F12 or Cmd/Ctrl+Shift+I to toggle)

## Architecture Overview

### Main Entry Points

- **Electron Main**: `src/main/index.ts`
  - Service initialization (`initializeServices()`)
  - Window/tray management
  - App termination handling (`before-quit` event)

- **IPC Handlers**: `src/main/ipc/index.ts`
  - Renderer ↔ Main bridge
  - Registers all IPC channel handlers

- **Preload**: `src/preload/*`
  - Provides safe IPC bridge
  - Exposes APIs for Renderer to call IPC

- **UI (Renderer)**: `src/renderer/*`
  - React + MUI-based UI
  - Zustand for state management
  - i18next for i18n (Japanese/English)

### Service Layer (`src/main/services/`)

Steps to add a new service:

1. Implement in `src/main/services/`
2. Initialize in `initializeServices()` in `src/main/index.ts`
3. Add exposed handlers in `initializeIPC()` in `src/main/ipc/index.ts`

**Main Services:**

- **ConfigManager**: Configuration file management (`~/.mcpm/config.json`)
- **ProcessManager**: MCP server process start/stop/monitoring
- **LogManager**: Daily log file management and auto-rotation
- **NgrokMultiTunnelManager**: Multiple port ngrok tunnel management
- **HttpsProxyManager**: Local HTTPS proxy (self-signed certificate management)

## Data Layout and File Structure

All app data is stored in `~/.mcpm/`:

```text
~/.mcpm/
├── config.json                      # App settings and MCP server definitions
├── certs/                           # HTTPS proxy certificates
│   └── <hostname>/
│       ├── cert.pem
│       └── key.pem
└── logs/                            # Log files
    ├── {server_id}_YYYYMMDD_stdout.log
    ├── {server_id}_YYYYMMDD_stderr.log
    ├── ngrok_YYYYMMDD.log
    └── https_proxy_YYYYMMDD.log
```

**Config file source**: `DEFAULT_CONFIG` in `src/shared/constants.ts`

## Critical Implementation Rules (Project-Specific)

### 1. IPC Communication Pattern

IPC contracts are managed as constants in `IPC_CHANNELS` in `src/shared/types.ts`.

**Steps to add/change IPC:**

1. Add channel name to `src/shared/types.ts`
2. Implement handler in `src/main/ipc/index.ts`
3. Add safe bridge in `src/preload/channels.ts`
4. Call from `src/renderer/*`

### 2. Configuration Management

`ConfigManager` (`src/main/services/ConfigManager.ts`) manages configuration:

- Settings are always merged with `DEFAULT_CONFIG`
- Provides methods: `getConfig()`, `updateConfig()`, `getSettings()`, `updateSettings()`, etc.
- When adding config fields, update `DEFAULT_CONFIG`

### 3. Process Management Features

`ProcessManager` manages MCP server processes:

- **Platform**: Supports `platform: 'host' | 'wsl'`
  - Check `SystemUtils.isWSLAvailable()` when using WSL
  - WSL distribution selection available
- **Auth Proxy**: When `useAuthProxy` is enabled, wraps command with `mcp-auth-proxy`
  - Data path handling differs (host/WSL)
  - OIDC configuration required
- **Log Management**: stdout/stderr written to daily logs via `LogManager`
- **Error Handling**: On startup failure, command line and environment variables are logged to stderr

### 4. Dynamic Import Usage

ngrok and selfsigned are loaded via dynamic import (for ESM/CJS compatibility):

- `NgrokMultiTunnelManager`: `await import('@ngrok/ngrok')`
- `HttpsProxyManager`: `await import('selfsigned')`

**Caution when changing**: Do not break ESM/CJS behavior

## Common Pitfalls

1. **ngrok Session Limit**
   - `start()` fails when ngrok concurrent session limit is reached
   - Error code `ERR_NGROK_108` is specially handled
   - Solution: Stop other ngrok agents (CLI/desktop, dashboard Agents)

2. **Window Close Behavior**
   - Window "×" button hides to tray (not quit)
   - Actual termination is aggregated in `before-quit` event
   - Full quit from tray menu "Quit"

3. **External Binary Path Detection**
   - Respect path detection logic for external binaries like `mcp-auth-proxy`
   - Always check WSL branching when present

## Coding Conventions

### General Principles

- **Readability**: Avoid environment-dependent characters, emojis, non-standard strings in code including comments
- **Maintainability**: Proper directory structure, consistent naming conventions, appropriate shared logic organization
- **Consistency**: UI follows unified design system (color tokens, typography, spacing, components)
- **Visual Quality**: Follow high visual quality bar from OSS guidelines (spacing, padding, hover states, etc.)

### Frontend

- TypeScript 5
- Styling: `@mui/material`
- Icons: `@mui/icons-material`

### Development Tools

- Package Manager: yarn 4 (Node.js 22)
- Builder: electron-builder
- Linter: ESLint 9
- Formatter: Prettier 3

## Context Gathering Strategy (for AI Agents)

### Efficient Context Gathering

**Goal**: Get enough context fast and act as soon as executable.

**Method**:

- Start broad, then fan out to focused subqueries
- Launch varied queries in parallel; read top hits per query
- Deduplicate paths and cache; don't repeat queries
- Avoid over-searching; if needed, run targeted searches in one parallel batch

**Early Stop Criteria**:

- You can name exact content to change
- Top hits converge (~70%) on one area/path

**Escalation**:

- If signals conflict or scope is fuzzy, run one refined parallel batch, then proceed

**Depth**:

- Trace only symbols you'll modify or whose contracts you rely on
- Avoid transitive expansion unless necessary

**Loop**:

- Batch search → minimal plan → complete task
- Search again only if validation fails or new unknowns appear
- Prefer acting over more searching

## Self-Reflection (for AI Agents)

Before tackling a task:

1. First, spend time thinking of a rubric until you are confident
2. Think deeply about every aspect of what makes for a world-class one-shot implementation
3. Create a rubric with 5-7 categories (do not show to user, internal only)
4. Use the rubric to internally think and iterate on the best solution to the given prompt
5. If not hitting top marks across all categories, start again

## Persistence (for AI Agents)

- You are an agent — keep going until the user's query is completely resolved before ending your turn
- Only terminate when you are sure the problem is solved
- Never stop or hand back to user when encountering uncertainty — research or deduce the most reasonable approach and continue
- Do not ask humans to confirm or clarify assumptions. Always adjust later — decide the most reasonable assumption, proceed with it, and document for user's reference after acting

## Key File Reference

Files to check first when making changes:

| Change Type | Files to Check | Steps |
|-------------|---------------|-------|
| Add/Change IPC | `src/shared/types.ts` → `src/main/ipc/index.ts` → `src/preload/*` → `src/renderer/*` | Define channel name → Implement handler → Add bridge → UI call |
| Add Service | `src/main/services/` → `src/main/index.ts` → `src/main/ipc/index.ts` | Service implementation → `initializeServices()` → `initializeIPC()` |
| Add Config Field | `src/shared/constants.ts` → `src/main/services/ConfigManager.ts` | Update `DEFAULT_CONFIG` → Verify load/save behavior |

**"Source of Truth" Files**:

- `src/main/index.ts` — App startup and lifecycle
- `src/main/ipc/index.ts` — IPC handler aggregation
- `src/main/services/ConfigManager.ts` — Configuration management
- `src/shared/constants.ts` — Default config and constants

## Environment Requirements

- **Node.js**: >= 22.0.0
- **Package Manager**: yarn 4 (do not use npm/pnpm)
- **Supported OS**: Windows 10/11 (WSL support), macOS 10.15+, Linux (Ubuntu/Debian, RHEL/CentOS/Fedora)

## Feedback Welcome

If this guide is missing information (additional files to touch, CI details, specific design reasons, etc.), please let us know.
