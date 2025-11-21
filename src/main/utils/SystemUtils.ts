import { exec, spawn, ChildProcess } from 'child_process';
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
        const result = await SystemUtils.execCommand(command, args, {
            platform: 'wsl',
            wslDistribution: distribution,
            env,
        });
        return { stdout: result.stdout, stderr: result.stderr };
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

    // Unified command execution utilities
    static spawnCommand(
        command: string,
        args: string[] = [],
        options: {
            platform?: 'host' | 'wsl';
            wslDistribution?: string;
            env?: Record<string, string>;
            cwd?: string;
            windowsHide?: boolean;
        } = {}
    ): ChildProcess {
        const platform = options.platform || 'host';
        const windowsHide = options.windowsHide !== undefined ? options.windowsHide : true;

        if (platform === 'wsl') {
            if (!options.wslDistribution) {
                throw new Error('WSL distribution is required for platform "wsl"');
            }

            const envParts = Object.entries(options.env || {}).map(
                ([key, value]) => `${key}=${this.quoteEnvValueForShell(value)}`
            );
            const argsStr = (args || []).map(a => this.quoteArgForShell(a)).join(' ');
            const bashCommand = [envParts.join(' '), command, argsStr]
                .filter(part => part && part.length > 0)
                .join(' ')
                .trim();

            return spawn('wsl.exe', ['-d', options.wslDistribution, '--', 'bash', '-lc', bashCommand], {
                cwd: options.cwd,
                windowsHide,
                shell: false,
            });
        }

        const isWin = os.platform() === 'win32';
        const isMac = os.platform() === 'darwin';
        let child: ChildProcess;
        if (isWin) {
            // On Windows, always use PowerShell for consistent execution
            const psCommand = `& '${command}' ${args.map(arg => `'${arg}'`).join(' ')}`;
            child = spawn('powershell', ['-Command', psCommand], {
                cwd: options.cwd,
                env: { ...process.env, ...(options.env || {}) },
                shell: false,
                windowsHide,
            });
        } else if (isMac) {
            // On macOS, use zsh to execute commands
            // This ensures shell environment variables (PATH from .zshrc, etc.) are maintained
            // Escape arguments properly for shell execution
            const escapedArgs = args.map(arg => {
                // Escape single quotes by replacing ' with '\''
                const escaped = arg.replace(/'/g, "'\\''");
                return `'${escaped}'`;
            });
            child = spawn('/bin/zsh', ['-c', `'${command}' ${escapedArgs.join(' ')}`.trim()], {
                cwd: options.cwd,
                env: { ...process.env, ...(options.env || {}) },
                shell: false,
                windowsHide,
            });
        } else {
            // On Unix-like systems, use direct execution
            child = spawn(command, args, {
                cwd: options.cwd,
                env: { ...process.env, ...(options.env || {}) },
                shell: false,
                windowsHide,
            });
        }

        return child;
    }

    // ---------- Quoting helpers ----------
    // Detect if string is already wrapped with matching quotes '...'
    // or "...". If so, do not re-wrap.
    static isWrappedWithQuotes(value: string): boolean {
        if (value.length < 2) return false;
        const start = value[0];
        const end = value[value.length - 1];
        return (start === '"' && end === '"') || (start === "'" && end === "'");
    }

    // For bash shell command (WSL path): quote argument using double quotes
    // Only wrap when not already wrapped. Escape characters that are special
    // inside double quotes: ", \\, $, `.
    static quoteArgForShell(value: string): string {
        if (this.isWrappedWithQuotes(value)) return value;
        return `"${String(value).replace(/(["\\$`])/g, '\\$1')}"`;
    }

    // For bash shell command (WSL path): quote env value using double quotes
    // Same rules as quoteArgForShell.
    static quoteEnvValueForShell(value: string): string {
        if (this.isWrappedWithQuotes(value)) return value;
        return `"${String(value).replace(/(["\\$`])/g, '\\$1')}"`;
    }

    // Build a display command line string from command + args (no env).
    static buildDisplayCommandLine(command: string | null, args: string[] = []): string {
        if (!command) return '(command not built)';
        const tokens = [command, ...args.map(a => String(a))];
        return tokens.join(' ');
    }

    // Build a display env string: KEY=VALUE pairs separated by spaces
    static buildDisplayEnvString(env?: Record<string, string>): string {
        const entries = Object.entries(env || {});
        if (entries.length === 0) return '(none)';
        return entries.map(([k, v]) => `${k}=${String(v)}`).join(' ');
    }

    static detectAuthProxyBinaryPath(preferredPath?: string, platform: NodeJS.Platform = process.platform): string {
        if (preferredPath && preferredPath.trim().length > 0) {
            return preferredPath;
        }
        // Name resolution by platform
        if (platform === 'win32') {
            return 'mcp-auth-proxy.exe';
        }
        return 'mcp-auth-proxy';
    }

    static execCommand(
        command: string,
        args: string[] = [],
        options: {
            platform?: 'host' | 'wsl';
            wslDistribution?: string;
            env?: Record<string, string>;
            cwd?: string;
            windowsHide?: boolean;
        } = {}
    ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';

            let child: ChildProcess;
            try {
                child = SystemUtils.spawnCommand(command, args, options);
            } catch (e) {
                reject(e);
                return;
            }

            child.stdout?.on('data', chunk => {
                stdout += chunk.toString();
            });

            child.stderr?.on('data', chunk => {
                stderr += chunk.toString();
            });

            child.on('error', err => {
                reject(err);
            });

            child.on('close', code => {
                resolve({ stdout, stderr, exitCode: code ?? -1 });
            });
        });
    }
}
