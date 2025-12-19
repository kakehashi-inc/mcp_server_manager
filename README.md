# MCP Server Manager

Electron-based GUI application to start/stop, monitor, log, and expose (via ngrok) MCP servers.

## Features

- **Process Management**: Register arbitrary MCP server commands, start/stop, status monitoring, error handling
- **Auto Start / Auto Restart**: Start on app launch, conditional auto-restart on abnormal exit
- **WSL Support (Windows)**: Run inside WSL with selectable distribution (`platform: "wsl"`)
- **Log Management**: Per-process daily log files for `stdout`/`stderr`, auto-clean by retention days, periodic rotation
- **ngrok Integration**: Open multiple ports at once, show/copy URLs, view/clear ngrok logs
- **HTTPS Proxy Management**: Terminate TLS locally and forward to local HTTP, per-day logs, self-signed cert auto-(re)generation
- **Auth Proxy (Optional)**: Wrap with `mcp-auth-proxy` to add OIDC authentication
- **i18n/Theme**: Japanese/English, light/dark modes

## Supported OS

- Windows 10/11
- macOS 10.15+
- Linux (Debian-based/RHEL-based)

Note: This project is not code-signed on Windows. If SmartScreen displays a warning, select "More info" → "Run anyway".

## Data Files Location

All data is stored under the `~/.mcpm` directory:

- **Config File**: `~/.mcpm/config.json`
- **Log Files**: `~/.mcpm/logs/`
  - Process logs: `{server_id}_YYYYMMDD_stdout.log`, `{server_id}_YYYYMMDD_stderr.log`
  - ngrok logs: `ngrok_YYYYMMDD.log`
  - HTTPS proxy logs: `https_proxy_YYYYMMDD.log`

### File Structure

```text
~/.mcpm/
├── config.json      # Settings and MCP server definitions
├── certs/           # Self-signed certificates per hostname for HTTPS proxy
│   └── <hostname>/
│       ├── cert.pem
│       └── key.pem
└── logs/            # Log files
    ├── {server_id}_YYYYMMDD_stdout.log
    ├── {server_id}_YYYYMMDD_stderr.log
    ├── ngrok_YYYYMMDD.log
    └── https_proxy_YYYYMMDD.log
```

### config.json Format

Configuration file generated based on the app's default `DEFAULT_CONFIG`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "NODE_ENV": "production"
      },
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
    "httpsProxies": {
      "example.local": {
        "forwardPort": 8080,
        "listenPort": 8443,
        "autoStart": true
      }
    },
    "oidcProviderName": "Auth0",
    "oidcConfigurationUrl": "",
    "oidcClientId": "",
    "oidcClientSecret": "",
    "oidcAllowedUsers": "",
    "oidcAllowedUsersGlob": ""
  }
}
```

#### MCP Server Configuration Fields

- **command**: Executable command
- **args**: Argument array
- **env**: Environment variables
- **displayName**: Display name
- **platform**: Execution environment ("host" | "wsl")
- **wslDistribution**: WSL distribution name (when using WSL)
- **autoStart**: Auto-start on app launch
- **autoRestartOnError**: Auto-restart on abnormal exit (conditional)
- **useAuthProxy**: Wrap execution with mcp-auth-proxy
- **authProxyListenPort** / **authProxyExternalUrl**: Required fields when using Auth Proxy

## Developer Reference

### Development Rules

- Developer documentation (except `README.md`, `README-ja.md`) should be placed in the `Documents` directory.
- Always run the linter after making changes and apply appropriate fixes. If intentionally allowing linter errors, document this in a comment. **Build is only for release; linter check is sufficient for debugging.**
- When implementing models, place files per table.
- Reusable components should be implemented in files within the `modules` directory.
- Temporary scripts (e.g., investigation scripts) should be placed in the `scripts` directory.
- When creating or modifying models, update `Documents/Table Definitions.md`. Table definitions should be represented as tables, showing column names, types, and relations.
- When system behavior changes, update `Documents/System Specifications.md`.

### Requirements

- Node.js 22.x or higher
- yarn 4
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Install dependencies
yarn install

# Start development
yarn dev
```

DevTools in development:

- DevTools open in detached mode automatically
- Toggle with F12 or Ctrl+Shift+I (Cmd+Option+I on macOS)

### Build/Distribute

- All platforms: `yarn dist`
- Windows: `yarn dist:win`
- macOS: `yarn dist:mac`
- Linux: `yarn dist:linux`

In development the app uses BrowserRouter with `<http://localhost:3001>`, and in production it uses HashRouter to load `dist/renderer/index.html`.

### Windows Prerequisite: Developer Mode

When building or running unsigned local releases on Windows, enable Developer Mode:

1. Open Settings → Privacy & security → For developers
2. Turn on "Developer Mode"
3. Reboot the OS

### Project Structure (excerpt)

```text
src/
├── main/                  # Electron main: IPC and managers
│   ├── index.ts           # App boot / window / service init
│   ├── ipc/               # IPC handlers
│   ├── services/          # Various services
│   └── utils/             # Various utilities
├── preload/               # Safe bridge APIs to renderer
├── renderer/              # React + MUI UI
├── shared/                # Types and constants (defaults/paths)
└── public/                # Icons, etc.
```

### Tech Stack

- **Electron**
- **React (MUI v7)**
- **TypeScript**
- **Zustand**
- **i18next**
- **Vite**

### Create Windows Icon

```exec
magick public/icon.png -define icon:auto-resize=256,128,96,64,48,32,24,16 public/icon.ico
```

### About WSL (Windows)

- On startup, the app detects WSL availability and retrieves the distribution list, default, and running states using `wsl.exe -l -q/-v`

### Notes

- ngrok may fail to start when hitting the concurrent session limit. Disconnect unnecessary sessions from CLI/Desktop or the Agents section in the dashboard.
- Closing with "×" minimizes the app to the tray instead of quitting. Use "Quit" from the tray menu to exit.
