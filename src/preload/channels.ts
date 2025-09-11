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
} as const;
