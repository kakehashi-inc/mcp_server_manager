'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const electron_1 = require('electron');
const types_1 = require('../shared/types');
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Process Management
    processAPI: {
        list: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.PROCESS_LIST),
        create: (id, config) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.PROCESS_CREATE, id, config),
        update: (id, config) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.PROCESS_UPDATE, id, config),
        delete: id => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.PROCESS_DELETE, id),
        start: id => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.PROCESS_START, id),
        stop: id => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.PROCESS_STOP, id),
        getStatus: id => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.PROCESS_STATUS, id),
        onStatusUpdate: callback => {
            electron_1.ipcRenderer.on(types_1.IPC_CHANNELS.PROCESS_STATUS_UPDATE, (_, id, status) =>
                callback(id, status)
            );
        },
    },
    // Config
    configAPI: {
        get: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.CONFIG_GET),
        update: config => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.CONFIG_UPDATE, config),
    },
    // Settings (backward compatibility)
    settingsAPI: {
        get: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.SETTINGS_GET),
        update: settings => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.SETTINGS_UPDATE, settings),
    },
    // WSL
    wslAPI: {
        check: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.WSL_CHECK),
        listDistributions: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.WSL_LIST_DISTRIBUTIONS),
    },
    // Logs
    logAPI: {
        read: (processId, type, lines) =>
            electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.LOG_READ, processId, type, lines),
        clear: processId => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.LOG_CLEAR, processId),
    },
    // System
    systemAPI: {
        getInfo: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.SYSTEM_INFO),
    },
    // Ngrok
    ngrokAPI: {
        start: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.NGROK_START),
        stop: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.NGROK_STOP),
        status: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.NGROK_STATUS),
        readLogs: lines => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.NGROK_LOG_READ, lines),
    },
    // Window controls
    windowAPI: {
        minimize: () => electron_1.ipcRenderer.send(types_1.IPC_CHANNELS.APP_MINIMIZE),
        maximize: () => electron_1.ipcRenderer.send(types_1.IPC_CHANNELS.APP_MAXIMIZE),
        close: () => electron_1.ipcRenderer.send(types_1.IPC_CHANNELS.APP_QUIT),
    },
});
