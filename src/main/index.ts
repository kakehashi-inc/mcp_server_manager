import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from 'electron';
import * as path from 'path';
import { initializeIPC } from './ipc';
import { ProcessManager } from './services/ProcessManager';
import { ConfigManager } from './services/ConfigManager';
import { LogManager } from './services/LogManager';
import { SystemUtils } from './utils/SystemUtils';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let processManager: ProcessManager;
let configManager: ConfigManager;
let logManager: LogManager;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    },
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, '../../public/icon.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
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

function createTray() {
  const iconPath = path.join(__dirname, '../../public/icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow?.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('MCP Server Manager');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

async function initializeServices() {
  // Initialize managers
  configManager = new ConfigManager();
  await configManager.initialize();
  
  logManager = new LogManager(configManager);
  await logManager.initialize();
  
  processManager = new ProcessManager(logManager, configManager);
  await processManager.initialize();
  
  // Initialize IPC handlers
  initializeIPC(processManager, configManager, logManager);
  
  // Start process monitoring
  processManager.startMonitoring();
  
  // Start log rotation
  logManager.startRotation();
}

app.whenReady().then(async () => {
  await initializeServices();
  createWindow();
  createTray();
  
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

app.on('before-quit', async () => {
  // Stop all processes if needed
  await processManager.stopAll();
  
  // Clean up
  processManager.stopMonitoring();
  logManager.stopRotation();
});

// Handle protocol for deep linking (optional)
app.setAsDefaultProtocolClient('mcp-manager');
