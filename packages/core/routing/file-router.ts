import * as fs from "fs";
import * as path from "path";
import { Router } from "../../router";

export interface FileRouteOptions {
  routesDir?: string;
  basePath?: string;
  fileExtensions?: string[];
}

const defaultOptions: Required<FileRouteOptions> = {
  routesDir: "routes",
  basePath: "",
  fileExtensions: [".ts", ".js"],
};

export class FileRouter {
  private options: Required<FileRouteOptions>;
  private router: Router;

  constructor(options: FileRouteOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.router = new Router();
  }

  async scanRoutes(): Promise<Router> {
    const routesPath = path.resolve(this.options.routesDir);

    if (!fs.existsSync(routesPath)) {
      console.warn(`Routes directory not found: ${routesPath}`);
      return this.router;
    }

    await this.scanDirectory(routesPath, "");
    return this.router;
  }

  private async scanDirectory(
    dirPath: string,
    currentPath: string
  ): Promise<void> {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Handle subdirectories
        const subPath = path.join(currentPath, item);
        await this.scanDirectory(itemPath, subPath);
      } else if (stat.isFile()) {
        // Handle route files
        const ext = path.extname(item);
        if (this.options.fileExtensions.includes(ext)) {
          await this.processRouteFile(itemPath, currentPath, item);
        }
      }
    }
  }

  private async processRouteFile(
    filePath: string,
    currentPath: string,
    filename: string
  ): Promise<void> {
    try {
      // Remove file extension to get route path
      const routeName = filename.replace(/\.(ts|js)$/, "");

      // Handle index files
      let routePath: string;
      if (routeName === "index") {
        routePath = currentPath || "/";
      } else {
        routePath = path.join(currentPath, routeName);
      }

      // Convert Windows path separators to URL format
      routePath = routePath.replace(/\\/g, "/");

      // Convert [param] syntax to :param
      routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");

      // Ensure leading slash
      if (!routePath.startsWith("/")) {
        routePath = "/" + routePath;
      }

      // Add base path
      if (this.options.basePath) {
        routePath = path
          .join(this.options.basePath, routePath)
          .replace(/\\/g, "/");
      }

      // Import the route module
      const routeModule = await import(filePath);

      // Register route handlers
      this.registerRouteHandlers(routePath, routeModule);
    } catch (error) {
      console.error(`Error processing route file ${filePath}:`, error);
    }
  }

  private registerRouteHandlers(routePath: string, routeModule: any): void {
    const httpMethods = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ];

    // Check for default export (handles all methods)
    if (routeModule.default && typeof routeModule.default === "function") {
      this.router.get(routePath, routeModule.default);
      return;
    }

    // Check for named exports (specific HTTP methods)
    for (const method of httpMethods) {
      const methodHandler = routeModule[method.toLowerCase()];
      if (methodHandler && typeof methodHandler === "function") {
        (this.router as any)[method.toLowerCase()](routePath, methodHandler);
      }
    }

    // If no handlers found, warn
    if (
      !routeModule.default &&
      !httpMethods.some((method) => routeModule[method.toLowerCase()])
    ) {
      console.warn(`No route handlers found in ${routePath}`);
    }
  }

  getRouter(): Router {
    return this.router;
  }
}

// Convenience function
export async function createFileRouter(
  options?: FileRouteOptions
): Promise<Router> {
  const fileRouter = new FileRouter(options);
  return await fileRouter.scanRoutes();
}
