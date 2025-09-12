import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types';
import { ProcessManager } from '../services/ProcessManager';
import { ConfigManager } from '../services/ConfigManager';
import { LogManager } from '../services/LogManager';
import { SystemUtils } from '../utils/SystemUtils';
import { NgrokMultiTunnelManager } from '../services/NgrokMultiTunnelManager';

export function initializeIPC(
    processManager: ProcessManager,
    configManager: ConfigManager,
    logManager: LogManager,
    ngrokManager?: NgrokMultiTunnelManager
) {
    // Process Management
    ipcMain.handle(IPC_CHANNELS.PROCESS_LIST, async () => {
        return await processManager.getAllProcesses();
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_CREATE, async (_, id, config) => {
        return await processManager.createProcess(id, config);
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_UPDATE, async (_, id, config) => {
        return await processManager.updateProcess(id, config);
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_DELETE, async (_, id) => {
        return await processManager.deleteProcess(id);
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_START, async (_, id) => {
        return await processManager.startProcess(id);
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_STOP, async (_, id) => {
        return await processManager.stopProcess(id);
    });

    ipcMain.handle(IPC_CHANNELS.PROCESS_STATUS, async (_, id) => {
        return await processManager.getProcessStatus(id);
    });

    // Config
    ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
        return configManager.getConfig();
    });

    ipcMain.handle(IPC_CHANNELS.CONFIG_UPDATE, async (_, config) => {
        return await configManager.updateConfig(config);
    });

    // Settings (backward compatibility)
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
        return configManager.getSettings();
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, settings) => {
        return await configManager.updateSettings(settings);
    });

    // WSL
    ipcMain.handle(IPC_CHANNELS.WSL_CHECK, async () => {
        return await SystemUtils.isWSLAvailable();
    });

    ipcMain.handle(IPC_CHANNELS.WSL_LIST_DISTRIBUTIONS, async () => {
        return await SystemUtils.getWSLDistributions();
    });

    // Logs
    ipcMain.handle(IPC_CHANNELS.LOG_READ, async (_, processId, type, lines) => {
        return await logManager.readLogs(processId, type, lines);
    });

    ipcMain.handle(IPC_CHANNELS.LOG_CLEAR, async (_, processId) => {
        return await logManager.clearLogs(processId);
    });

    // System
    ipcMain.handle(IPC_CHANNELS.SYSTEM_INFO, async () => {
        return await SystemUtils.getSystemInfo();
    });

    // Ngrok
    ipcMain.handle(IPC_CHANNELS.NGROK_START, async () => {
        if (!ngrokManager) return [];
        try {
            return await ngrokManager.start();
        } catch (e: any) {
            // Surface error message to renderer
            throw new Error(e?.message || String(e));
        }
    });
    ipcMain.handle(IPC_CHANNELS.NGROK_STOP, async () => {
        if (!ngrokManager) return true;
        await ngrokManager.stop();
        return true;
    });
    ipcMain.handle(IPC_CHANNELS.NGROK_STATUS, async () => {
        if (!ngrokManager) return [];
        return ngrokManager.status();
    });
    ipcMain.handle(IPC_CHANNELS.NGROK_LOG_READ, async (_, lines?: number) => {
        if (!ngrokManager) return [];
        return await ngrokManager.readLogs(lines || 200);
    });
    ipcMain.handle(IPC_CHANNELS.NGROK_LOG_CLEAR, async () => {
        if (!ngrokManager) return;
        try {
            await ngrokManager.clearLogs();
        } catch {
            // ignore
        }
    });
}
