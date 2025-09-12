import { ConfigManager } from './ConfigManager';
import { createWriteStream, WriteStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { APP_NAME } from '../../shared/constants';

type NgrokSession = any;
type NgrokListener = any;

export interface NgrokTunnelInfo {
    port: number;
    url?: string;
    name: string;
}

export class NgrokMultiTunnelManager {
    private configManager: ConfigManager;
    private session: NgrokSession | null = null;
    private listeners: Map<number, NgrokListener> = new Map();
    private tunnelInfos: Map<number, NgrokTunnelInfo> = new Map();
    private logStream: WriteStream | null = null;

    constructor(configManager: ConfigManager) {
        this.configManager = configManager;
    }

    private getLogFilePath(): string {
        const logDir = this.configManager.getLogDirectory();
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        return path.join(logDir, `ngrok_${dateStr}.log`);
    }

    private async ensureLogStream(): Promise<void> {
        if (!this.logStream) {
            this.logStream = createWriteStream(this.getLogFilePath(), { flags: 'a' });
        }
    }

    private async log(message: string): Promise<void> {
        await this.ensureLogStream();
        const ts = new Date().toISOString();
        this.logStream!.write(`[${ts}] ${message}\n`);
    }

    async start(): Promise<NgrokTunnelInfo[]> {
        const settings = this.configManager.getSettings();
        const authToken = settings.ngrokAuthToken?.trim();
        const metadata = (settings.ngrokMetadataName || APP_NAME).trim();
        const portsStr = settings.ngrokPorts?.trim() || '';
        const ports = portsStr
            .split(',')
            .map(p => parseInt(p.trim(), 10))
            .filter(p => Number.isFinite(p) && p > 0);

        if (!authToken) {
            await this.log('Ngrok auth token is not set.');
            throw new Error('NGROK_AUTHTOKEN is empty');
        }
        if (ports.length === 0) {
            await this.log('No ports specified for ngrok.');
            throw new Error('No ngrok ports configured');
        }

        // Close previous session if any
        await this.stop();

        try {
            // Dynamic import to support ESM package in CJS
            const ngrokMod = await import('@ngrok/ngrok');
            const ngrok: any = (ngrokMod as any).default ?? ngrokMod;
            // Prefer widely compatible API first
            for (const port of ports) {
                const urlObj = await ngrok.connect({ addr: port, authtoken: authToken, metadata, proto: 'http' });
                // Extract URL string defensively across SDK shapes
                let url = '';
                try {
                    if (typeof urlObj === 'string') {
                        url = urlObj;
                    } else if (urlObj && typeof urlObj.url === 'function') {
                        const v = urlObj.url();
                        url = typeof v === 'string' ? v : String(v ?? '');
                    } else if (urlObj && typeof urlObj.url === 'string') {
                        url = urlObj.url;
                    } else if (urlObj && typeof urlObj.toString === 'function') {
                        const v = urlObj.toString();
                        url = typeof v === 'string' ? v : String(v ?? '');
                    }
                } catch {}

                const info: NgrokTunnelInfo = { port, url, name: `port-${port}` };
                this.tunnelInfos.set(port, info);
                await this.log(`Tunnel started: ${port} -> ${url || '[no url]'}`);
            }

            // Optionally try new Session API if specifically enabled in the future
            // (kept commented out to avoid incompatibility issues)
            // if (ngrok.SessionBuilder && process.env.NGROK_USE_SESSION_API === '1') { ... }
        } catch (e: any) {
            const msg = e?.message || String(e);
            await this.log(`Ngrok start failed: ${msg}`);
            // ensure cleanup on failure
            try {
                await this.stop();
            } catch {
                // ignore
            }
            if (e?.errorCode === 'ERR_NGROK_108') {
                throw new Error(
                    'ngrokの同時セッション数の上限に達しています。他のngrokエージェントを停止してください（ngrok CLI/デスクトップ、またはダッシュボードのAgentsでDisconnect）。'
                );
            }
            throw e;
        }

        return Array.from(this.tunnelInfos.values());
    }

    async stop(): Promise<void> {
        try {
            if (this.listeners.size > 0) {
                for (const listener of this.listeners.values()) {
                    try {
                        if (listener.close) await listener.close();
                    } catch {
                        //
                    }
                }
                this.listeners.clear();
            }
            if (this.session) {
                try {
                    if (this.session.close) await this.session.close();
                } catch {
                    //
                }
                this.session = null;
            }
            this.tunnelInfos.clear();
        } finally {
            if (this.logStream) {
                this.logStream.end();
                this.logStream = null;
            }
        }
    }

    status(): NgrokTunnelInfo[] {
        return Array.from(this.tunnelInfos.values());
    }

    async readLogs(lines: number = 200): Promise<string[]> {
        try {
            const file = this.getLogFilePath();
            const content = await fs.readFile(file, 'utf-8');
            const arr = content.split('\n').filter(l => l.trim() !== '');
            return arr.slice(-lines);
        } catch {
            return [];
        }
    }
}
