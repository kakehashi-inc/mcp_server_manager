## Quick Guide — MCP Server Manager (for AI)

Purpose: Minimal, concrete instructions to quickly understand this repository and safely implement changes.

- Development/Build
  - Development: `yarn dev` (internally runs `dev:main` (tsc -w), `dev:renderer` (vite@3001), `dev:electron` in parallel)
  - Build: `yarn build` → `yarn start` (production mode uses HashRouter)
  - Distribution: `yarn dist:mac|win|linux` (electron-builder)

- Main Entries and Patterns
  - Electron Main: `src/main/index.ts` (service init, tray/window, before-quit behavior)
  - IPC Handlers: `src/main/ipc/index.ts` (connects Renderer and main)
  - Preload (safe bridge): Renderer calls IPC through `src/preload/*`
  - UI: `src/renderer/*` (Vite + React + MUI)
  - Service implementations go in `src/main/services/`. New services are registered in `initializeServices()` and exposed via IPC.

- Important Data/Config/Logs
  - Config file: `~/.mcpm/config.json` (generated from `DEFAULT_CONFIG` in `src/shared/constants.ts`)
  - Certificates: `~/.mcpm/certs/<hostname>/(cert.pem|key.pem)` (HttpsProxy managed)
  - Logs: `~/.mcpm/logs/`. File name patterns:
    - Process: `{server_id}_YYYYMMDD_stdout.log` / `_stderr.log`
    - ngrok: `ngrok_YYYYMMDD.log`
    - https proxy: `https_proxy_YYYYMMDD.log`

- Critical Implementation Rules (project-specific)
  - IPC contracts managed as constants: changing `src/shared/types.ts` (`IPC_CHANNELS`) requires updating both Renderer and Main.
  - Config management is `ConfigManager` (`src/main/services/ConfigManager.ts`). Settings are always merged with DEFAULT_CONFIG.
  - Process launch handled by `ProcessManager`. Features:
    - Supports `platform: 'host'|'wsl'` (check `SystemUtils.isWSLAvailable()` for WSL)
    - When `useAuthProxy` is enabled, wraps command with `mcp-auth-proxy` (data path handling present)
    - stdout/stderr written to daily logs via LogManager. On startup failure, command line and env are written to stderr log (heuristic)
  - ngrok and selfsigned are loaded via dynamic import (ESM/CJS compatible) in `NgrokMultiTunnelManager` and `HttpsProxyManager`. Do not break ESM/CJS behavior when changing.

- Files to Check First When Making Changes
  - Add/change IPC: `src/shared/types.ts` (channel name) → `src/main/ipc/index.ts` (handler) → `src/preload/*` → `src/renderer/*` (UI caller)
  - Add service: Implement in `src/main/services/` → initialize in `initializeServices()` (`src/main/index.ts`) → add exposed handler to `initializeIPC()`
  - Add config field: Update `DEFAULT_CONFIG` (`src/shared/constants.ts`) and verify `ConfigManager` load/save behavior

- Environment/Version Notes
  - Expects Node.js >= 22 (see package.json engines)
  - Package manager is yarn 4. Be cautious if using other tools in CI/local.

- Common Pitfalls
  - ngrok `start()` fails due to concurrent session limit (Ngrok error code is specially handled)
  - Window close hides to tray (close is not always app quit). Process termination is aggregated in `before-quit`
  - Respect path detection/WSL branching for native/external binaries (mcp-auth-proxy, etc.)

If unsure which file is the "source of truth", start with `src/main/index.ts`, `src/main/ipc/index.ts`, `src/main/services/ConfigManager.ts`, `src/shared/constants.ts`.

Feedback welcome. Tell us what's missing (e.g., additional files to touch, CI details, or specific design reasons) and we'll incorporate it.
