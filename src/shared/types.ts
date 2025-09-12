// MCP Server Configuration Types
export interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
    displayName?: string;
    platform?: 'host' | 'wsl';
    wslDistribution?: string;
    autoStart?: boolean;
    autoRestartOnError?: boolean;
    // mcp-auth-proxy integration
    useAuthProxy?: boolean;
    authProxyListenPort?: number; // required when useAuthProxy
    authProxyExternalUrl?: string; // required when useAuthProxy
}

export interface MCPServers {
    [key: string]: MCPServerConfig;
}

export interface ProcessStatus {
    id: string;
    pid?: number;
    status: 'running' | 'stopped' | 'error';
    startedAt?: string;
    cpu?: number;
    memory?: number;
    lastChecked: string;
}

export type PlatformType = 'host' | 'wsl';

export interface WSLDistribution {
    name: string;
    version: number;
    isDefault: boolean;
    state: 'Running' | 'Stopped';
}

// Settings Types
export interface AppSettings {
    language: 'ja' | 'en';
    darkMode: boolean;
    logDirectory: string;
    logRetentionDays: number;
    restartDelayMs: number;
    successfulStartThresholdMs: number;
    // Ngrok settings
    ngrokAuthToken?: string;
    ngrokMetadataName?: string; // metadataに渡す識別名
    ngrokPorts?: string; // カンマ区切り "3000,4000"
    ngrokAutoStart?: boolean;
    // OIDC settings for mcp-auth-proxy
    oidcProviderName?: string; // 初期値: Auth0
    oidcConfigurationUrl?: string;
    oidcClientId?: string;
    oidcClientSecret?: string;
    oidcAllowedUsers?: string; // カンマ区切り
    oidcAllowedUsersGlob?: string; // 例: *@example.com
}

// Complete Config Structure
export interface AppConfig {
    mcpServers: MCPServers;
    settings: AppSettings;
}

// Log Types
export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    processId: string;
    type: 'stdout' | 'stderr';
}

// IPC Channel Names
export const IPC_CHANNELS = {
    // Process Management
    PROCESS_LIST: 'process:list',
    PROCESS_CREATE: 'process:create',
    PROCESS_UPDATE: 'process:update',
    PROCESS_DELETE: 'process:delete',
    PROCESS_START: 'process:start',
    PROCESS_STOP: 'process:stop',
    PROCESS_STATUS: 'process:status',
    PROCESS_STATUS_UPDATE: 'process:status-update',

    // Config
    CONFIG_GET: 'config:get',
    CONFIG_UPDATE: 'config:update',

    // WSL
    WSL_CHECK: 'wsl:check',
    WSL_LIST_DISTRIBUTIONS: 'wsl:list-distributions',

    // Settings (kept for backward compatibility)
    SETTINGS_GET: 'settings:get',
    SETTINGS_UPDATE: 'settings:update',

    // Logs
    LOG_READ: 'log:read',
    LOG_CLEAR: 'log:clear',

    // System
    SYSTEM_INFO: 'system:info',
    APP_QUIT: 'app:quit',
    APP_MINIMIZE: 'app:minimize',
    APP_MAXIMIZE: 'app:maximize',

    // Ngrok
    NGROK_START: 'ngrok:start',
    NGROK_STOP: 'ngrok:stop',
    NGROK_STATUS: 'ngrok:status',
    NGROK_LOG_READ: 'ngrok:log:read',
    NGROK_LOG_CLEAR: 'ngrok:log:clear',
} as const;

// System Info
export interface SystemInfo {
    platform: NodeJS.Platform;
    arch: string;
    version: string;
    wslAvailable: boolean;
    homeDirectory: string;
}
