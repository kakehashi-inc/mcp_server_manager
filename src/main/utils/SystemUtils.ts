import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { SystemInfo, WSLDistribution } from '@shared/types';

const execAsync = promisify(exec);

export class SystemUtils {
  static async getSystemInfo(): Promise<SystemInfo> {
    const wslAvailable = await this.isWSLAvailable();
    
    return {
      platform: process.platform,
      arch: process.arch,
      version: os.release(),
      wslAvailable,
      homeDirectory: os.homedir()
    };
  }

  static async isWSLAvailable(): Promise<boolean> {
    if (process.platform !== 'win32') {
      return false;
    }

    try {
      await execAsync('wsl --list --quiet');
      return true;
    } catch {
      return false;
    }
  }

  static async getWSLDistributions(): Promise<WSLDistribution[]> {
    if (process.platform !== 'win32') {
      return [];
    }

    try {
      const { stdout } = await execAsync('wsl --list --verbose');
      const lines = stdout.split('\n').slice(1); // Skip header
      const distributions: WSLDistribution[] = [];

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const isDefault = parts[0] === '*';
          const name = isDefault ? parts[1] : parts[0];
          const stateIndex = isDefault ? 2 : 1;
          const versionIndex = isDefault ? 3 : 2;
          
          if (name && name !== '') {
            distributions.push({
              name,
              version: parseInt(parts[versionIndex]) || 2,
              isDefault,
              state: parts[stateIndex] === 'Running' ? 'Running' : 'Stopped'
            });
          }
        }
      }

      return distributions;
    } catch (error) {
      console.error('Failed to get WSL distributions:', error);
      return [];
    }
  }

  static async executeInWSL(
    distribution: string,
    command: string,
    args: string[] = [],
    env: Record<string, string> = {}
  ): Promise<{ stdout: string; stderr: string }> {
    const envStr = Object.entries(env)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    const fullCommand = `wsl -d ${distribution} ${envStr} ${command} ${args.join(' ')}`;
    
    try {
      const { stdout, stderr } = await execAsync(fullCommand);
      return { stdout, stderr };
    } catch (error: any) {
      return { stdout: '', stderr: error.message || 'Unknown error' };
    }
  }

  static getPlatformName(): string {
    switch (process.platform) {
      case 'win32':
        return 'Windows';
      case 'darwin':
        return 'macOS';
      case 'linux':
        return 'Linux';
      default:
        return process.platform;
    }
  }

  static isLinuxDistro(type: 'ubuntu' | 'rhel'): boolean {
    if (process.platform !== 'linux') {
      return false;
    }

    try {
      const osRelease = require('fs').readFileSync('/etc/os-release', 'utf8');
      
      if (type === 'ubuntu') {
        return osRelease.includes('Ubuntu') || osRelease.includes('Debian');
      } else if (type === 'rhel') {
        return osRelease.includes('Red Hat') || osRelease.includes('CentOS') || 
               osRelease.includes('Fedora') || osRelease.includes('Rocky') || 
               osRelease.includes('AlmaLinux');
      }
    } catch {
      return false;
    }

    return false;
  }
}
