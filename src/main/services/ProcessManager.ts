import { spawn, ChildProcess } from 'child_process';
import { MCPServerConfig, ProcessStatus } from '../../shared/types';
import { PROCESS_CHECK_INTERVAL } from '../../shared/constants';
import { LogManager } from './LogManager';
import { ConfigManager } from './ConfigManager';
import { BrowserWindow } from 'electron';

export class ProcessManager {
  private runningProcesses: Map<string, ChildProcess>;
  private processStatuses: Map<string, ProcessStatus>;
  private logManager: LogManager;
  private configManager: ConfigManager;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(logManager: LogManager, configManager: ConfigManager) {
    this.runningProcesses = new Map();
    this.processStatuses = new Map();
    this.logManager = logManager;
    this.configManager = configManager;
  }

  async initialize(): Promise<void> {
    await this.initializeStatuses();
    await this.autoStartProcesses();
  }

  private async initializeStatuses(): Promise<void> {
    const servers = this.configManager.getMCPServers();

    for (const id of Object.keys(servers)) {
      this.processStatuses.set(id, {
        id,
        status: 'stopped',
        lastChecked: new Date().toISOString()
      });
    }
  }

  private async autoStartProcesses(): Promise<void> {
    const servers = this.configManager.getMCPServers();

    for (const [id, config] of Object.entries(servers)) {
      if (config.autoStart) {
        await this.startProcess(id);
      }
    }
  }

  async getAllProcesses(): Promise<Array<{ id: string; config: MCPServerConfig }>> {
    const servers = this.configManager.getMCPServers();
    return Object.entries(servers).map(([id, config]) => ({ id, config }));
  }

  async createProcess(id: string, config: MCPServerConfig): Promise<void> {
    await this.configManager.addMCPServer(id, config);
    this.processStatuses.set(id, {
      id,
      status: 'stopped',
      lastChecked: new Date().toISOString()
    });
  }

  async updateProcess(id: string, config: Partial<MCPServerConfig>): Promise<void> {
    await this.configManager.updateMCPServer(id, config);
  }

  async deleteProcess(id: string): Promise<boolean> {
    // Stop the process if running
    await this.stopProcess(id);

    // Remove from config
    await this.configManager.deleteMCPServer(id);

    // Remove status
    this.processStatuses.delete(id);

    // Clear logs
    await this.logManager.clearLogs(id);

    return true;
  }

  async renameProcess(oldId: string, newId: string): Promise<void> {
    // Stop the process if running
    const wasRunning = this.runningProcesses.has(oldId);
    if (wasRunning) {
      await this.stopProcess(oldId);
    }

    // Rename in config
    await this.configManager.renameMCPServer(oldId, newId);

    // Update status
    const oldStatus = this.processStatuses.get(oldId);
    if (oldStatus) {
      this.processStatuses.delete(oldId);
      this.processStatuses.set(newId, { ...oldStatus, id: newId });
    }

    // Restart if it was running
    if (wasRunning) {
      await this.startProcess(newId);
    }
  }

  async startProcess(id: string): Promise<boolean> {
    const config = this.configManager.getMCPServer(id);
    if (!config) {
      return false;
    }

    // Check if already running
    if (this.runningProcesses.has(id)) {
      return true;
    }

    try {
      let childProcess: ChildProcess;

      if (config.platform === 'wsl' && config.wslDistribution) {
        // Execute in WSL
        const wslCommand = `wsl -d ${config.wslDistribution}`;
        const envStr = Object.entries(config.env || {})
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');

        childProcess = spawn(wslCommand, [
          '-e', 'bash', '-c',
          `${envStr} ${config.command} ${config.args.join(' ')}`
        ], {
          shell: true,
          windowsHide: true
        });
      } else {
        // Execute on host
        childProcess = spawn(config.command, config.args, {
          env: { ...process.env, ...config.env },
          shell: true,
          windowsHide: true
        });
      }

      // Set up log streams
      await this.logManager.createLogStream(id);

      childProcess.stdout?.on('data', async (data) => {
        await this.logManager.writeLog(id, 'stdout', data.toString());
      });

      childProcess.stderr?.on('data', async (data) => {
        await this.logManager.writeLog(id, 'stderr', data.toString());
      });

      childProcess.on('exit', async (code) => {
        this.runningProcesses.delete(id);
        await this.logManager.closeLogStream(id);

        this.updateProcessStatus(id, {
          status: code === 0 ? 'stopped' : 'error',
          pid: undefined,
          startedAt: undefined
        });
      });

      this.runningProcesses.set(id, childProcess);

      this.updateProcessStatus(id, {
        status: 'running',
        pid: childProcess.pid,
        startedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error(`Failed to start process ${id}:`, error);
      this.updateProcessStatus(id, {
        status: 'error'
      });
      return false;
    }
  }

  async stopProcess(id: string): Promise<boolean> {
    const childProcess = this.runningProcesses.get(id);
    if (!childProcess) {
      return false;
    }

    return new Promise((resolve) => {
      childProcess.on('exit', () => {
        this.runningProcesses.delete(id);
        this.updateProcessStatus(id, {
          status: 'stopped',
          pid: undefined,
          startedAt: undefined
        });
        resolve(true);
      });

      // Try graceful shutdown first
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', childProcess.pid!.toString(), '/f', '/t']);
      } else {
        childProcess.kill('SIGTERM');

        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (this.runningProcesses.has(id)) {
            childProcess.kill('SIGKILL');
          }
        }, 5000);
      }
    });
  }

  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.runningProcesses.keys()).map(id =>
      this.stopProcess(id)
    );
    await Promise.all(stopPromises);
  }

  private updateProcessStatus(id: string, updates: Partial<ProcessStatus>): void {
    const currentStatus = this.processStatuses.get(id) || {
      id,
      status: 'stopped',
      lastChecked: new Date().toISOString()
    };

    this.processStatuses.set(id, {
      ...currentStatus,
      ...updates,
      lastChecked: new Date().toISOString()
    });

    // Send update to renderer
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.webContents.send('process:status-update', id, this.processStatuses.get(id));
    });
  }

  startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.checkProcessStatuses();
    }, PROCESS_CHECK_INTERVAL);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async checkProcessStatuses(): Promise<void> {
    for (const [id, childProcess] of this.runningProcesses) {
      try {
        // Check if process is still running
        if (childProcess.killed || childProcess.exitCode !== null) {
          this.runningProcesses.delete(id);
          await this.logManager.closeLogStream(id);
          this.updateProcessStatus(id, {
            status: 'stopped',
            pid: undefined,
            startedAt: undefined
          });
        } else {
          // Update resource usage if possible
          this.updateProcessStatus(id, {
            status: 'running'
          });
        }
      } catch (error) {
        console.error(`Error checking process ${id}:`, error);
      }
    }
  }

  async getProcessStatus(id: string): Promise<ProcessStatus | null> {
    return this.processStatuses.get(id) || null;
  }

  async getAllStatuses(): Promise<ProcessStatus[]> {
    return Array.from(this.processStatuses.values());
  }
}
