import * as fs from 'fs/promises';
import * as path from 'path';
import { AppConfig, AppSettings, MCPServerConfig, MCPServers } from '../../shared/types';
import { DEFAULT_CONFIG, getConfigPath } from '../../shared/constants';

export class ConfigManager {
    private config: AppConfig;
    private configPath: string;

    constructor() {
        this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        this.configPath = getConfigPath();
    }

    async initialize(): Promise<void> {
        await this.ensureConfigDirectory();
        await this.loadConfig();
    }

    private async ensureConfigDirectory(): Promise<void> {
        const dir = path.dirname(this.configPath);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    private async loadConfig(): Promise<void> {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            const loadedConfig = JSON.parse(data);
            // Merge with defaults to ensure all fields exist
            this.config = {
                mcpServers: loadedConfig.mcpServers || {},
                settings: { ...DEFAULT_CONFIG.settings, ...(loadedConfig.settings || {}) },
            };
        } catch (error) {
            // If file doesn't exist or is invalid, use defaults
            this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            await this.saveConfig();
        }
    }

    private async saveConfig(): Promise<void> {
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    }

    // Full config methods
    getConfig(): AppConfig {
        return JSON.parse(JSON.stringify(this.config));
    }

    async updateConfig(newConfig: Partial<AppConfig>): Promise<AppConfig> {
        this.config = {
            ...this.config,
            ...newConfig,
        };
        await this.saveConfig();
        return this.getConfig();
    }

    // Settings methods
    getSettings(): AppSettings {
        return { ...this.config.settings };
    }

    async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
        this.config.settings = { ...this.config.settings, ...newSettings };
        await this.saveConfig();
        return this.getSettings();
    }

    // MCP Server methods
    getMCPServers(): MCPServers {
        return { ...this.config.mcpServers };
    }

    getMCPServer(id: string): MCPServerConfig | null {
        return this.config.mcpServers[id] || null;
    }

    async addMCPServer(id: string, server: MCPServerConfig): Promise<void> {
        if (this.config.mcpServers[id]) {
            throw new Error(`Server with id '${id}' already exists`);
        }
        this.config.mcpServers[id] = server;
        await this.saveConfig();
    }

    async updateMCPServer(id: string, server: Partial<MCPServerConfig>): Promise<void> {
        if (!this.config.mcpServers[id]) {
            throw new Error(`Server with id '${id}' not found`);
        }
        this.config.mcpServers[id] = {
            ...this.config.mcpServers[id],
            ...server,
        };
        await this.saveConfig();
    }

    async deleteMCPServer(id: string): Promise<void> {
        delete this.config.mcpServers[id];
        await this.saveConfig();
    }

    async renameMCPServer(oldId: string, newId: string): Promise<void> {
        if (!this.config.mcpServers[oldId]) {
            throw new Error(`Server with id '${oldId}' not found`);
        }
        if (this.config.mcpServers[newId]) {
            throw new Error(`Server with id '${newId}' already exists`);
        }

        this.config.mcpServers[newId] = this.config.mcpServers[oldId];
        delete this.config.mcpServers[oldId];
        await this.saveConfig();
    }

    // Utility methods
    getLogDirectory(distribution?: string): string {
        if (distribution && this.config.settings.wslLogDirectories[distribution]) {
            return this.config.settings.wslLogDirectories[distribution];
        }
        return this.config.settings.logDirectory;
    }
}
