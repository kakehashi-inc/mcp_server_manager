import { contextBridge, ipcRenderer } from 'electron';

const IPC_CHANNELS = {
    PROCESS_LIST: 'process:list',
    PROCESS_CREATE: 'process:create',
    PROCESS_UPDATE: 'process:update',
    PROCESS_DELETE: 'process:delete',
    PROCESS_START: 'process:start',
    PROCESS_STOP: 'process:stop',
    PROCESS_STATUS: 'process:status',
    PROCESS_STATUS_UPDATE: 'process:status-update',
    CONFIG_GET: 'config:get',
    CONFIG_UPDATE: 'config:update',
    WSL_CHECK: 'wsl:check',
    WSL_LIST_DISTRIBUTIONS: 'wsl:list-distributions',
    SETTINGS_GET: 'settings:get',
    SETTINGS_UPDATE: 'settings:update',
    LOG_READ: 'log:read',
    LOG_CLEAR: 'log:clear',
    SYSTEM_INFO: 'system:info',
    APP_QUIT: 'app:quit',
    APP_MINIMIZE: 'app:minimize',
    APP_MAXIMIZE: 'app:maximize',
    NGROK_START: 'ngrok:start',
    NGROK_STOP: 'ngrok:stop',
    NGROK_STATUS: 'ngrok:status',
    NGROK_LOG_READ: 'ngrok:log:read',
    NGROK_LOG_CLEAR: 'ngrok:log:clear',
} as const;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Process Management
    processAPI: {
        list: () => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_LIST),
        create: (id: string, config: any) => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_CREATE, id, config),
        update: (id: string, config: any) => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_UPDATE, id, config),
        delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_DELETE, id),
        start: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_START, id),
        stop: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_STOP, id),
        getStatus: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_STATUS, id),
        onStatusUpdate: (callback: (id: string, status: any) => void) => {
            ipcRenderer.on(IPC_CHANNELS.PROCESS_STATUS_UPDATE, (_, id, status) => callback(id, status));
        },
    },

    // Config
    configAPI: {
        get: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
        update: (config: any) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_UPDATE, config),
    },

    // Settings (backward compatibility)
    settingsAPI: {
        get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
        update: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),
    },

    // WSL
    wslAPI: {
        check: () => ipcRenderer.invoke(IPC_CHANNELS.WSL_CHECK),
        listDistributions: () => ipcRenderer.invoke(IPC_CHANNELS.WSL_LIST_DISTRIBUTIONS),
    },

    // Logs
    logAPI: {
        read: (processId: string, type: 'stdout' | 'stderr', lines?: number) =>
            ipcRenderer.invoke(IPC_CHANNELS.LOG_READ, processId, type, lines),
        clear: (processId: string) => ipcRenderer.invoke(IPC_CHANNELS.LOG_CLEAR, processId),
    },

    // System
    systemAPI: {
        getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_INFO),
    },

    // Ngrok
    ngrokAPI: {
        start: () => ipcRenderer.invoke(IPC_CHANNELS.NGROK_START),
        stop: () => ipcRenderer.invoke(IPC_CHANNELS.NGROK_STOP),
        status: () => ipcRenderer.invoke(IPC_CHANNELS.NGROK_STATUS),
        readLogs: (lines?: number) => ipcRenderer.invoke(IPC_CHANNELS.NGROK_LOG_READ, lines),
        clearLogs: () => ipcRenderer.invoke(IPC_CHANNELS.NGROK_LOG_CLEAR),
    },

    // Window controls
    windowAPI: {
        minimize: () => ipcRenderer.send(IPC_CHANNELS.APP_MINIMIZE),
        maximize: () => ipcRenderer.send(IPC_CHANNELS.APP_MAXIMIZE),
        close: () => ipcRenderer.send(IPC_CHANNELS.APP_QUIT),
    },
});

// Type declarations for TypeScript
declare global {
    interface Window {
        electronAPI: {
            processAPI: {
                list: () => Promise<any[]>;
                create: (id: string, config: any) => Promise<any>;
                update: (id: string, config: any) => Promise<any>;
                delete: (id: string) => Promise<boolean>;
                start: (id: string) => Promise<boolean>;
                stop: (id: string) => Promise<boolean>;
                getStatus: (id: string) => Promise<any>;
                onStatusUpdate: (callback: (id: string, status: any) => void) => void;
            };
            configAPI: {
                get: () => Promise<any>;
                update: (config: any) => Promise<any>;
            };
            settingsAPI: {
                get: () => Promise<any>;
                update: (settings: any) => Promise<any>;
            };
            wslAPI: {
                check: () => Promise<boolean>;
                listDistributions: () => Promise<any[]>;
            };
            logAPI: {
                read: (processId: string, type: 'stdout' | 'stderr', lines?: number) => Promise<string[]>;
                clear: (processId: string) => Promise<void>;
            };
            systemAPI: {
                getInfo: () => Promise<any>;
            };
            ngrokAPI: {
                start: () => Promise<any[]>;
                stop: () => Promise<boolean>;
                status: () => Promise<any[]>;
                readLogs: (lines?: number) => Promise<string[]>;
                clearLogs: () => Promise<void>;
            };
            windowAPI: {
                minimize: () => void;
                maximize: () => void;
                close: () => void;
            };
        };
    }
}
