import * as chokidar from "chokidar";
import * as path from "path";
import * as http from "http";

export interface HotReloadOptions {
  watchPaths?: string[];
  ignored?: string[];
  delay?: number;
  verbose?: boolean;
}

const defaultOptions: Required<HotReloadOptions> = {
  watchPaths: ["packages/**/*.ts", "examples/**/*.ts"],
  ignored: ["node_modules/**", "dist/**", "**/*.test.ts", "**/*.d.ts"],
  delay: 300,
  verbose: true,
};

export class HotReload {
  private watcher: chokidar.FSWatcher | null = null;
  private server: http.Server | null = null;
  private restartTimeout: NodeJS.Timeout | null = null;
  private isRestarting = false;
  private options: Required<HotReloadOptions>;

  constructor(options: HotReloadOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  start(server: http.Server): void {
    this.server = server;

    if (this.options.verbose) {
      console.log("🔥 Hot reload enabled");
      console.log(`📁 Watching: ${this.options.watchPaths.join(", ")}`);
    }

    this.watcher = chokidar.watch(this.options.watchPaths, {
      ignored: this.options.ignored,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher.on("change", (filePath) => this.handleFileChange(filePath));
    this.watcher.on("add", (filePath) => this.handleFileChange(filePath));
    this.watcher.on("unlink", (filePath) => this.handleFileChange(filePath));

    // Handle process termination
    process.on("SIGINT", () => this.stop());
    process.on("SIGTERM", () => this.stop());
  }

  private handleFileChange(filePath: string): void {
    const relativePath = path.relative(process.cwd(), filePath);

    if (this.options.verbose) {
      console.log(`📝 File changed: ${relativePath}`);
    }

    // Debounce restarts
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    this.restartTimeout = setTimeout(() => {
      this.restartServer();
    }, this.options.delay);
  }

  private async restartServer(): Promise<void> {
    if (this.isRestarting || !this.server) return;

    this.isRestarting = true;

    if (this.options.verbose) {
      console.log("🔄 Restarting server...");
    }

    try {
      // Close existing connections gracefully
      this.server.close((err) => {
        if (err) {
          console.error("❌ Error closing server:", err);
        } else if (this.options.verbose) {
          console.log("✅ Server closed successfully");
        }
      });

      // Wait a bit for connections to close
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Exit the process to trigger restart (handled by nodemon/pm2/etc)
      if (this.options.verbose) {
        console.log("🚀 Triggering restart...");
      }

      process.exit(0);
    } catch (error) {
      console.error("❌ Error during restart:", error);
      this.isRestarting = false;
    }
  }

  stop(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    if (this.watcher) {
      this.watcher.close();
    }

    if (this.options.verbose) {
      console.log("🛑 Hot reload stopped");
    }
  }
}

// Convenience function for easy usage
export function enableHotReload(
  server: http.Server,
  options?: HotReloadOptions,
): HotReload {
  const hotReload = new HotReload(options);
  hotReload.start(server);
  return hotReload;
}
