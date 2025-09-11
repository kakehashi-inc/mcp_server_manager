import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs';
import { SystemInfo, WSLDistribution } from '../../shared/types';

const execAsync = promisify(exec);

export class SystemUtils {
    static async getSystemInfo(): Promise<SystemInfo> {
        const wslAvailable = await this.isWSLAvailable();

        return {
            platform: process.platform,
            arch: process.arch,
            version: os.release(),
            wslAvailable,
            homeDirectory: os.homedir(),
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
            const execBuffer = (command: string): Promise<Buffer> => {
                return new Promise(resolve => {
                    exec(command, { encoding: 'buffer' }, (_err: unknown, stdout: Buffer | string | null) => {
                        if (Buffer.isBuffer(stdout)) {
                            resolve(stdout);
                        } else if (typeof stdout === 'string') {
                            resolve(Buffer.from(stdout, 'utf8'));
                        } else {
                            resolve(Buffer.alloc(0));
                        }
                    });
                });
            };

            const decode = (buf: Buffer): string => {
                if (!buf || buf.length === 0) return '';
                let zeroCount = 0;
                const sampleLen = Math.min(buf.length, 2048);
                for (let i = 0; i < sampleLen; i++) if (buf[i] === 0) zeroCount++;
                const isUtf16le = zeroCount > sampleLen / 10; // many NUL bytes => UTF-16LE
                return buf.toString(isUtf16le ? 'utf16le' : 'utf8');
            };

            // (kept for reference) verbose parser removed from active use

            // First, get names only (robust to localization)
            const qBuf = await execBuffer('wsl.exe -l -q');
            const names = decode(qBuf)
                .split(/\r?\n/)
                .map(l => l.trim())
                .filter(l => l.length > 0);

            // Try to obtain default and running status from verbose output (best-effort)
            const vBuf = await execBuffer('wsl.exe -l -v');
            const verboseText = decode(vBuf);
            const defaultMatch = verboseText.match(/^\s*\*\s*(.+?)\s{2,}/m);
            const defaultName = defaultMatch ? defaultMatch[1].trim() : undefined;

            const runningNames = new Set<string>();
            verboseText.split(/\r?\n/).forEach(line => {
                const m = line.replace(/^\s*\*\s*/, '').match(/^\s*(.+?)\s{2,}(\S+)/);
                if (m && /running/i.test(m[2])) {
                    runningNames.add(m[1].trim());
                }
            });

            // Compose results, unique by name
            const seen = new Set<string>();
            const result: WSLDistribution[] = [];
            for (const name of names) {
                if (seen.has(name)) continue;
                seen.add(name);
                result.push({
                    name,
                    version: 2,
                    isDefault: defaultName === name,
                    state: runningNames.has(name) ? 'Running' : 'Stopped',
                });
            }

            return result;
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { stdout: '', stderr: message };
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
            const osRelease = fs.readFileSync('/etc/os-release', 'utf8');

            if (type === 'ubuntu') {
                return osRelease.includes('Ubuntu') || osRelease.includes('Debian');
            } else if (type === 'rhel') {
                return (
                    osRelease.includes('Red Hat') ||
                    osRelease.includes('CentOS') ||
                    osRelease.includes('Fedora') ||
                    osRelease.includes('Rocky') ||
                    osRelease.includes('AlmaLinux')
                );
            }
        } catch {
            return false;
        }

        return false;
    }
}
