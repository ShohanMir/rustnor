import { Middleware } from "./context";
import { promises as fs } from "fs";
import * as path from "path";

const mimeTypes: { [key: string]: string } = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

export const staticMiddleware = (root: string): Middleware => {
  const staticRoot = path.resolve(process.cwd(), root);

  return async (ctx, next) => {
    const filePath = path.join(staticRoot, ctx.request.pathname);

    try {
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || "application/octet-stream";

        ctx.response.setHeader("Content-Type", contentType);
        ctx.response.status(200);
        ctx.res.end((await fs.readFile(filePath)).toString());
        return; // File served, stop middleware chain
      }
    } catch (err: any) {
      // If file not found or other fs error, just pass to next middleware
      if (err.code !== "ENOENT") {
        console.error(`Error serving static file ${filePath}:`, err);
      }
    }

    await next(); // File not found or not a file, continue to next middleware
  };
};
