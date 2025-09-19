# MCP Server Manager

Electron-based GUI to start/stop, monitor, log, and expose (via ngrok) MCP servers.

## Features

- Process management: register arbitrary MCP server commands, start/stop, status monitoring, error handling
- Auto start / auto restart: start on app launch, conditional auto-restart on abnormal exit
- WSL support (Windows): run inside WSL with selectable distribution (`platform: "wsl"`)
- Log management: per-process daily log files for `stdout`/`stderr`, auto-clean by retention days, hourly rotation
- ngrok integration: open multiple ports at once, show/copy URLs, view/clear ngrok logs
- Auth Proxy (optional): wrap with `mcp-auth-proxy` to add OIDC authentication
- i18n/theme: Japanese/English, light/dark modes

## Supported OS

- Windows 10/11 (with WSL detection/list)
- macOS 10.15+
- Linux (Ubuntu/Debian, RHEL/CentOS/Fedora)

## Setup

### Requirements

- Node.js 22.x+
- yarn 4
- Git

### Install

```bash
# Clone the repository
git clone <repository-url>
cd mcp_server_manager

# Install dependencies
yarn install

# Start development (main: tsc -w / renderer: Vite / Electron)
yarn dev
```

DevTools in development:

- DevTools open in detached mode automatically
- Toggle with F12 or Ctrl+Shift+I (Cmd+Option+I on macOS)

## Build/Distribute

- All platforms: `yarn dist`
- Windows: `yarn dist:win`
- macOS: `yarn dist:mac`
- Linux: `yarn dist:linux`

In development the app uses BrowserRouter with `<http://localhost:3001>`, and in production it uses HashRouter to load `dist/renderer/index.html`.

### Windows prerequisite: Developer Mode

When building or running unsigned local releases on Windows, enable Developer Mode:

1. Open Settings → Privacy & security → For developers
2. Turn on "Developer Mode"
3. Reboot if Windows asks you to

Note: The app is not code-signed on Windows. SmartScreen may show a warning; click "More info" → "Run anyway".

## Project Structure (excerpt)

```text
src/
├── main/                  # Electron main: IPC and managers
│   ├── index.ts           # App boot / window / service init
│   ├── ipc/               # IPC handlers
│   ├── services/          # Process/Config/Log/ngrok managers
│   └── utils/             # SystemUtils (WSL/exec helpers)
├── preload/               # Safe bridge APIs to renderer
├── renderer/              # React + MUI UI (Processes/Logs/Settings/Ngrok)
├── shared/                # Types and constants (defaults/paths)
└── public/                # Icons
```

## Tech Stack

- Electron
- React (MUI v7)
- TypeScript
- Zustand
- i18next
- Vite

## License

MIT

## For Developers

### Execution Modes

- Development: `yarn dev` (Vite: <http://localhost:3001>, BrowserRouter)
- Production: `yarn build && yarn start` (HashRouter loading `dist/renderer/index.html`)

### Data Files Location

All app data is stored under `~/.mcpm`.

- Config: `~/.mcpm/config.json`
- Logs: `~/.mcpm/logs/`

Example:

```text
~/.mcpm/
├── config.json      # App settings and MCP server definitions
└── logs/
    ├── {server_id}_YYYYMMDD_stdout.log
    └── {server_id}_YYYYMMDD_stderr.log
```

### config.json

The app loads/creates `~/.mcpm/config.json` based on `DEFAULT_CONFIG` in `shared/constants.ts`.

#### Structure

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": { "NODE_ENV": "production" },
      "displayName": "Sequential Thinking Server",
      "platform": "host",
      "autoStart": true,
      "autoRestartOnError": true,
      "useAuthProxy": false
    },
    "file-server": {
      "command": "python",
      "args": ["mcp_server.py"],
      "displayName": "File Server",
      "platform": "wsl",
      "wslDistribution": "Ubuntu",
      "autoStart": false
    }
  },
  "settings": {
    "language": "ja",
    "darkMode": false,
    "logDirectory": "~/.mcpm/logs",
    "logRetentionDays": 7,
    "restartDelayMs": 5000,
    "successfulStartThresholdMs": 10000,
    "showWindowOnStartup": true,
    "ngrokAuthToken": "",
    "ngrokMetadataName": "MCP Server Manager",
    "ngrokPorts": "3000,4000",
    "ngrokAutoStart": false,
    "oidcProviderName": "Auth0",
    "oidcConfigurationUrl": "",
    "oidcClientId": "",
    "oidcClientSecret": "",
    "oidcAllowedUsers": "",
    "oidcAllowedUsersGlob": ""
  }
}
```

#### MCP Server Fields

- command: executable command
- args: argument list
- env: environment variables
- displayName: display name
- platform: execution environment ("host" | "wsl")
- wslDistribution: WSL distro name (when `platform: "wsl"`)
- autoStart: start with the app
- autoRestartOnError: auto-restart on abnormal exit (conditionally)
- useAuthProxy: wrap with mcp-auth-proxy
- authProxyListenPort / authProxyExternalUrl: required when using Auth Proxy

### WSL on Windows

- On startup the app detects WSL and lists distributions via `wsl.exe -l -q/-v` (default and running states included)

### Create Windows Icon

```exec
magick public/icon.png -define icon:auto-resize=256,128,96,64,48,32,24,16 public/icon.ico
```

## Notes

- ngrok may fail to start when you hit the concurrent session limit. Stop other agents (CLI/Desktop) or disconnect agents from the dashboard.
- Close button behavior: the window hides to tray instead of quitting. Use the tray menu "Quit" to exit.
