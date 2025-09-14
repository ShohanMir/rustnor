import { Middleware, Context } from "./context";

export interface FastJsonOptions {
  limit?: number; // bytes, default 1MB
  strict?: boolean; // strict JSON parsing, default true
  reviver?: (key: string, value: any) => any;
  streamThreshold?: number; // threshold for streaming vs buffer, default 64KB
}

const defaultOptions: Required<FastJsonOptions> = {
  limit: 1024 * 1024, // 1MB
  strict: true,
  reviver: (key, value) => value,
  streamThreshold: 64 * 1024, // 64KB
};

export const fastJson = (options: FastJsonOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    const contentType = ctx.req.headers["content-type"] || "";
    const method = ctx.req.method;

    // Only process JSON for relevant methods
    if (
      (method === "POST" || method === "PUT" || method === "PATCH") &&
      contentType.includes("application/json")
    ) {
      try {
        const contentLength = parseInt(
          ctx.req.headers["content-length"] || "0",
        );

        // Use streaming for large payloads
        if (contentLength > config.streamThreshold) {
          ctx.request.body = await parseJsonStream(ctx.req, config);
        } else {
          ctx.request.body = await parseJsonBuffer(ctx.req, config);
        }
      } catch (err: any) {
        ctx.response.status(400);
        ctx.response.setHeader("Content-Type", "application/json");
        const errorBody = {
          error: "Invalid JSON",
          message: err.message || "Failed to parse request body as JSON",
        };
        ctx.response.body = errorBody;
        ctx.res.writeHead(400, ctx.res.getHeaders());
        ctx.res.end(JSON.stringify(errorBody));
        return;
      }
    }

    await next();
  };
};

// High-performance streaming JSON parser
async function parseJsonStream(
  req: any,
  config: Required<FastJsonOptions>,
): Promise<any> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let totalSize = 0;
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escaped = false;

    const processChunk = (chunk: Buffer) => {
      const chunkStr = chunk.toString("utf8");
      totalSize += chunk.length;

      if (totalSize > config.limit) {
        req.destroy(
          new Error(`Request entity too large: ${totalSize} > ${config.limit}`),
        );
        return;
      }

      for (let i = 0; i < chunkStr.length; i++) {
        const char = chunkStr[i];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === "\\") {
          escaped = true;
          continue;
        }

        if (char === '"' && !escaped) {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (char === "{") braceCount++;
        else if (char === "}") braceCount--;
        else if (char === "[") bracketCount++;
        else if (char === "]") bracketCount--;
      }

      buffer += chunkStr;
    };

    req.on("data", processChunk);

    req.on("end", () => {
      try {
        if (braceCount !== 0 || bracketCount !== 0) {
          throw new Error("Unmatched braces or brackets in JSON");
        }

        const parsed = JSON.parse(buffer, config.reviver);

        if (config.strict) {
          // Additional validation for strict mode
          validateJsonStructure(parsed);
        }

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}

// Fast buffer-based JSON parser for smaller payloads
async function parseJsonBuffer(
  req: any,
  config: Required<FastJsonOptions>,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    req.on("data", (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > config.limit) {
        req.destroy(
          new Error(`Request entity too large: ${totalSize} > ${config.limit}`),
        );
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const buffer = Buffer.concat(chunks);
        const parsed = JSON.parse(buffer.toString("utf8"), config.reviver);

        if (config.strict) {
          validateJsonStructure(parsed);
        }

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}

// Validate JSON structure for strict mode
function validateJsonStructure(obj: any): void {
  if (obj === null || typeof obj !== "object") {
    return; // Primitive values are fine
  }

  // Check for prototype pollution
  if (obj.__proto__ !== Object.prototype && obj.__proto__ !== Array.prototype) {
    throw new Error("Invalid object prototype");
  }

  // Recursively validate nested objects
  if (Array.isArray(obj)) {
    for (const item of obj) {
      validateJsonStructure(item);
    }
  } else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Check for dangerous keys
        if (
          key === "__proto__" ||
          key === "constructor" ||
          key === "prototype"
        ) {
          throw new Error(`Dangerous property name: ${key}`);
        }
        validateJsonStructure(obj[key]);
      }
    }
  }
}
