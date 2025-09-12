import { AppConfig } from './types';
import * as path from 'path';
import * as os from 'os';

// Default Configuration
export const DEFAULT_CONFIG: AppConfig = {
    mcpServers: {},
    settings: {
        language: 'ja',
        darkMode: false,
        logDirectory: path.join(os.homedir(), '.mcpm', 'logs'),
        logRetentionDays: 7,
        restartDelayMs: 5000,
        successfulStartThresholdMs: 10000,
        ngrokAuthToken: '',
        ngrokMetadataName: 'MCP Server Manager',
        ngrokPorts: '',
        ngrokAutoStart: false,
    },
};

// App Constants
export const APP_NAME = 'MCP Server Manager';
export const APP_VERSION = '1.0.0';

// Process Check Interval (ms)
export const PROCESS_CHECK_INTERVAL = 5000;

// Log Rotation Interval (ms)
export const LOG_ROTATION_INTERVAL = 3600000; // 1 hour

// Supported Languages
export const SUPPORTED_LANGUAGES = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
] as const;

// File Paths
export const getAppDataPath = () => {
    // All settings are stored in ~/.mcpm directory
    return path.join(os.homedir(), '.mcpm');
};

export const getConfigPath = () => {
    return path.join(getAppDataPath(), 'config.json');
};
