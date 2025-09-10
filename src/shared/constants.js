"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigPath = exports.getAppDataPath = exports.SUPPORTED_LANGUAGES = exports.LOG_ROTATION_INTERVAL = exports.PROCESS_CHECK_INTERVAL = exports.APP_VERSION = exports.APP_NAME = exports.DEFAULT_CONFIG = void 0;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// Default Configuration
exports.DEFAULT_CONFIG = {
    mcpServers: {},
    settings: {
        language: 'ja',
        darkMode: false,
        logDirectory: path.join(os.homedir(), '.mcpm', 'logs'),
        wslLogDirectories: {},
        logRetentionDays: 7
    }
};
// App Constants
exports.APP_NAME = 'MCP Server Manager';
exports.APP_VERSION = '1.0.0';
// Process Check Interval (ms)
exports.PROCESS_CHECK_INTERVAL = 5000;
// Log Rotation Interval (ms)
exports.LOG_ROTATION_INTERVAL = 3600000; // 1 hour
// Supported Languages
exports.SUPPORTED_LANGUAGES = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' }
];
// File Paths
const getAppDataPath = () => {
    // All settings are stored in ~/.mcpm directory
    return path.join(os.homedir(), '.mcpm');
};
exports.getAppDataPath = getAppDataPath;
const getConfigPath = () => {
    return path.join((0, exports.getAppDataPath)(), 'config.json');
};
exports.getConfigPath = getConfigPath;
