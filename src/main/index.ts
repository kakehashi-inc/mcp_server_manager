import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { initializeIPC } from './ipc';
import { ProcessManager } from './services/ProcessManager';
import { ConfigManager } from './services/ConfigManager';
import { LogManager } from './services/LogManager';
import { NgrokMultiTunnelManager } from './services/NgrokMultiTunnelManager';

let mainWindow: BrowserWindow | null = null;
let processManager: ProcessManager;
let configManager: ConfigManager;
let logManager: LogManager;
let ngrokManager: NgrokMultiTunnelManager;

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, '../preload/index.js'),
        },
        frame: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        icon: ((): string | undefined => {
            const pngPath = path.join(__dirname, '../../public/icon.png');
            const svgPath = path.join(__dirname, '../../public/icon.svg');
            if (fs.existsSync(pngPath)) return pngPath;
            if (fs.existsSync(svgPath)) return svgPath;
            return undefined;
        })(),
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3001');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Custom title bar handlers for Windows/Linux
    if (process.platform !== 'darwin') {
        ipcMain.on('app:minimize', () => {
            mainWindow?.minimize();
        });

        ipcMain.on('app:maximize', () => {
            if (mainWindow?.isMaximized()) {
                mainWindow.restore();
            } else {
                mainWindow?.maximize();
            }
        });

        ipcMain.on('app:quit', () => {
            app.quit();
        });
    }
}

async function initializeServices() {
    // Initialize managers
    configManager = new ConfigManager();
    await configManager.initialize();

    logManager = new LogManager(configManager);
    await logManager.initialize();

    processManager = new ProcessManager(logManager, configManager);
    await processManager.initialize();

    // Ngrok manager (independent from process manager)
    ngrokManager = new NgrokMultiTunnelManager(configManager);

    // Initialize IPC handlers
    initializeIPC(processManager, configManager, logManager, ngrokManager);

    // Optional auto-start ngrok based on settings
    try {
        const settings = configManager.getSettings();
        if (settings.ngrokAutoStart) {
            await ngrokManager.start();
        }
    } catch (e) {
        // Ignore failures at startup; user can start from UI
    }

    // Start process monitoring
    processManager.startMonitoring();

    // Start log rotation
    logManager.startRotation();
}

app.whenReady().then(async () => {
    await initializeServices();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

let isQuitting = false;
app.on('before-quit', async e => {
    if (isQuitting) return;
    e.preventDefault();
    try {
        // Ensure all child processes are stopped before exiting
        await processManager.stopAll();
    } catch (err) {
        // No-op; proceed to exit regardless
    } finally {
        processManager.stopMonitoring();
        logManager.stopRotation();
        isQuitting = true;
        app.exit(0);
    }
});

// Handle protocol for deep linking (optional)
app.setAsDefaultProtocolClient('mcp-manager');
