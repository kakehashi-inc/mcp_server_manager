import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream, WriteStream } from 'fs';
import { ConfigManager } from './ConfigManager';
import { LOG_ROTATION_INTERVAL } from '../../shared/constants';

export class LogManager {
  private configManager: ConfigManager;
  private logStreams: Map<string, { stdout: WriteStream; stderr: WriteStream }>;
  private rotationInterval: NodeJS.Timeout | null = null;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.logStreams = new Map();
  }

  private escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async initialize(): Promise<void> {
    await this.ensureLogDirectory();
  }

  private async ensureLogDirectory(): Promise<void> {
    const logDir = this.configManager.getLogDirectory();
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  private getLogFileName(processId: string, type: 'stdout' | 'stderr'): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `${processId}_${dateStr}_${type}.log`;
  }

  async createLogStream(processId: string): Promise<void> {
    const logDir = this.configManager.getLogDirectory();
    const stdoutPath = path.join(logDir, this.getLogFileName(processId, 'stdout'));
    const stderrPath = path.join(logDir, this.getLogFileName(processId, 'stderr'));

    const stdoutStream = createWriteStream(stdoutPath, { flags: 'a' });
    const stderrStream = createWriteStream(stderrPath, { flags: 'a' });

    this.logStreams.set(processId, {
      stdout: stdoutStream,
      stderr: stderrStream
    });
  }

  async writeLog(processId: string, type: 'stdout' | 'stderr', data: string): Promise<void> {
    const streams = this.logStreams.get(processId);
    if (!streams) {
      await this.createLogStream(processId);
      return this.writeLog(processId, type, data);
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${data}\n`;

    if (type === 'stdout') {
      streams.stdout.write(logEntry);
    } else {
      streams.stderr.write(logEntry);
    }
  }

  async closeLogStream(processId: string): Promise<void> {
    const streams = this.logStreams.get(processId);
    if (streams) {
      streams.stdout.end();
      streams.stderr.end();
      this.logStreams.delete(processId);
    }
  }

  async readLogs(
    processId: string,
    type: 'stdout' | 'stderr',
    lines: number = 100
  ): Promise<string[]> {
    const logDir = this.configManager.getLogDirectory();

    try {
      const files = await fs.readdir(logDir);
      const id = this.escapeRegExp(processId);
      const pattern = new RegExp(`^(?:${id}|log_${id})_\\d{8}(?:_\\d{2})?_${type}\\.log$`);
      const matchingFiles = files
        .filter((f) => pattern.test(f))
        .sort()
        .reverse();

      const allLines: string[] = [];

      for (const file of matchingFiles) {
        if (allLines.length >= lines) break;

        const content = await fs.readFile(path.join(logDir, file), 'utf-8');
        const fileLines = content.split('\n').filter(line => line.trim() !== '');
        allLines.push(...fileLines);
      }

      return allLines.slice(-lines);
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }

  async clearLogs(processId: string): Promise<void> {
    const logDir = this.configManager.getLogDirectory();

    try {
      const files = await fs.readdir(logDir);
      const id = this.escapeRegExp(processId);
      const pattern = new RegExp(`^(?:${id}|log_${id})_\\d{8}(?:_\\d{2})?_(?:stdout|stderr)\\.log$`);
      const matchingFiles = files.filter((f) => pattern.test(f));

      for (const file of matchingFiles) {
        await fs.unlink(path.join(logDir, file));
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  async rotateLogsForProcess(processId: string): Promise<void> {
    const streams = this.logStreams.get(processId);
    if (streams) {
      streams.stdout.end();
      streams.stderr.end();
      await this.createLogStream(processId);
    }
  }

  startRotation(): void {
    this.rotationInterval = setInterval(async () => {
      await this.rotateLogs();
      await this.cleanOldLogs();
    }, LOG_ROTATION_INTERVAL);
  }

  stopRotation(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }

  private async rotateLogs(): Promise<void> {
    for (const processId of this.logStreams.keys()) {
      await this.rotateLogsForProcess(processId);
    }
  }

  private async cleanOldLogs(): Promise<void> {
    const logDir = this.configManager.getLogDirectory();
    const retentionDays = this.configManager.getSettings().logRetentionDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const files = await fs.readdir(logDir);

      const pattern = new RegExp(`^(?:.*|log_.*)_\\d{8}(?:_\\d{2})?_(?:stdout|stderr)\\.log$`);
      for (const file of files) {
        if (!pattern.test(file)) continue;
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning old logs:', error);
    }
  }
}
