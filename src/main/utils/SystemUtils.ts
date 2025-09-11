import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
import { SystemInfo, WSLDistribution } from "../../shared/types";

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
        if (process.platform !== "win32") {
            return false;
        }

        try {
            await execAsync("wsl --list --quiet");
            return true;
        } catch {
            return false;
        }
    }

    static async getWSLDistributions(): Promise<WSLDistribution[]> {
        if (process.platform !== "win32") {
            return [];
        }

        try {
            const { stdout } = await execAsync("wsl.exe -l -v");
            const lines = stdout
                .split(/\r?\n/)
                .map((l) => l.trimEnd())
                .filter((l) => l.trim().length > 0)
                .filter((l) => !/^name\s+state\s+version/i.test(l)); // drop header

            const distributions: WSLDistribution[] = [];
            const rowRegex = /^\s*(\*)?\s*(.+?)\s{2,}(\S+)\s{2,}(\d+)\s*$/;

            for (const line of lines) {
                const m = line.match(rowRegex);
                if (!m) continue;
                const isDefault = !!m[1];
                const name = m[2];
                const stateRaw = m[3];
                const versionRaw = m[4];
                const state = /running/i.test(stateRaw) || /実行/.test(stateRaw) ? "Running" : "Stopped";
                const version = parseInt(versionRaw) || 2;
                distributions.push({ name, version, isDefault, state });
            }

            return distributions;
        } catch (error) {
            console.error("Failed to get WSL distributions:", error);
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
            .join(" ");

        const fullCommand = `wsl -d ${distribution} ${envStr} ${command} ${args.join(" ")}`;

        try {
            const { stdout, stderr } = await execAsync(fullCommand);
            return { stdout, stderr };
        } catch (error: any) {
            return { stdout: "", stderr: error.message || "Unknown error" };
        }
    }

    static getPlatformName(): string {
        switch (process.platform) {
            case "win32":
                return "Windows";
            case "darwin":
                return "macOS";
            case "linux":
                return "Linux";
            default:
                return process.platform;
        }
    }

    static isLinuxDistro(type: "ubuntu" | "rhel"): boolean {
        if (process.platform !== "linux") {
            return false;
        }

        try {
            const osRelease = require("fs").readFileSync("/etc/os-release", "utf8");

            if (type === "ubuntu") {
                return osRelease.includes("Ubuntu") || osRelease.includes("Debian");
            } else if (type === "rhel") {
                return (
                    osRelease.includes("Red Hat") ||
                    osRelease.includes("CentOS") ||
                    osRelease.includes("Fedora") ||
                    osRelease.includes("Rocky") ||
                    osRelease.includes("AlmaLinux")
                );
            }
        } catch {
            return false;
        }

        return false;
    }
}
