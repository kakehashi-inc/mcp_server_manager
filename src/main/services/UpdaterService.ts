import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { IPC_CHANNELS } from '../../shared/types';
import type { UpdateState } from '../../shared/types';

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

class UpdaterService {
    private state: UpdateState = { status: 'idle' };
    private autoInstallOnDownloaded = false;
    private startupCheckScheduled = false;
    private initialized = false;

    initialize(): void {
        if (isDev) return;
        if (this.initialized) return;
        this.initialized = true;

        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = false;
        autoUpdater.logger = console;

        autoUpdater.on('checking-for-update', () => {
            this.state = { status: 'checking' };
        });

        autoUpdater.on('update-available', info => {
            this.state = { status: 'available', version: info?.version };
            this.broadcast();
        });

        autoUpdater.on('update-not-available', () => {
            this.state = { status: 'not-available' };
        });

        autoUpdater.on('download-progress', progress => {
            const percent = typeof progress?.percent === 'number' ? progress.percent : 0;
            this.state = { ...this.state, status: 'downloading', progress: percent };
            this.broadcast();
        });

        autoUpdater.on('update-downloaded', info => {
            this.state = { status: 'downloaded', version: info?.version };
            this.broadcast();
            if (this.autoInstallOnDownloaded) {
                setTimeout(() => this.quitAndInstall(), 1500);
            }
        });

        autoUpdater.on('error', err => {
            console.error('[updater] error:', err);
            this.autoInstallOnDownloaded = false;
            this.state = { status: 'idle' };
            this.broadcast();
        });
    }

    getState(): UpdateState {
        return this.state;
    }

    async checkForUpdates(): Promise<void> {
        if (isDev) return;
        try {
            await autoUpdater.checkForUpdates();
        } catch (err) {
            console.error('[updater] checkForUpdates failed:', err);
        }
    }

    async downloadUpdate(): Promise<void> {
        if (isDev) return;
        this.autoInstallOnDownloaded = true;
        try {
            await autoUpdater.downloadUpdate();
        } catch (err) {
            this.autoInstallOnDownloaded = false;
            console.error('[updater] downloadUpdate failed:', err);
        }
    }

    quitAndInstall(): void {
        if (isDev) return;
        setImmediate(() => {
            for (const w of BrowserWindow.getAllWindows()) {
                try {
                    w.removeAllListeners('close');
                    w.close();
                } catch {}
            }
            try {
                autoUpdater.quitAndInstall(false, true);
            } catch (err) {
                console.error('[updater] quitAndInstall failed:', err);
            }
        });
    }

    scheduleStartupCheck(window: BrowserWindow, delayMs = 3000): void {
        if (isDev) return;
        if (this.startupCheckScheduled) return;
        this.startupCheckScheduled = true;

        const run = () => {
            setTimeout(() => {
                this.checkForUpdates();
            }, delayMs);
        };

        if (window.webContents.isLoading()) {
            window.webContents.once('did-finish-load', run);
        } else {
            run();
        }
    }

    private broadcast(): void {
        const payload = this.state;
        for (const w of BrowserWindow.getAllWindows()) {
            try {
                if (!w.isDestroyed()) {
                    w.webContents.send(IPC_CHANNELS.UPDATER_STATE_CHANGED, payload);
                }
            } catch {}
        }
    }
}

export const updaterService = new UpdaterService();
