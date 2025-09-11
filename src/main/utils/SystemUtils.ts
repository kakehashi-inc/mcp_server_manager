import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
import * as fs from "fs";
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
            const parseVerbose = (text: string): WSLDistribution[] => {
                const lines = text
                    .split(/\r?\n/)
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0)
                    .filter((l) => !/^name\s+state\s+version/i.test(l));

                const out: WSLDistribution[] = [];
                for (const line of lines) {
                    const isDefault = line.startsWith("*");
                    const rest = isDefault ? line.slice(1).trim() : line;
                    const cols = rest.split(/\s{2,}/);
                    if (cols.length < 3) continue;
                    const name = cols[0];
                    const stateRaw = cols[1];
                    const versionRaw = cols[2];
                    if (!name) continue;
                    const state = /running/i.test(stateRaw) ? "Running" : "Stopped";
                    const version = parseInt(versionRaw) || 2;
                    out.push({ name, version, isDefault, state });
                }
                return out;
            };

            // Try verbose first
            const { stdout } = await execAsync("wsl.exe -l -v");
            let dists = parseVerbose(stdout);

            // Fallback to quiet list if nothing parsed
            if (dists.length === 0) {
                const { stdout: qout } = await execAsync("wsl.exe -l -q");
                dists = qout
                    .split(/\r?\n/)
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0)
                    .map<WSLDistribution>((name) => ({ name, version: 2, isDefault: false, state: "Stopped" }));
            }

            return dists;
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { stdout: "", stderr: message };
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
            const osRelease = fs.readFileSync("/etc/os-release", "utf8");

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
