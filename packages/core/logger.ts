import { Middleware } from "./context";

export interface LoggerOptions {
  level?: "info" | "warn" | "error";
  format?: "combined" | "common" | "dev" | "short" | "tiny" | "json";
  skip?: (ctx: any) => boolean;
}

const defaultOptions: Required<LoggerOptions> = {
  level: "info",
  format: "combined",
  skip: () => false,
};

export const logger = (options: LoggerOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    const start = Date.now();

    // Skip logging if configured
    if (config.skip(ctx)) {
      await next();
      return;
    }

    // Pre-request log
    const preLog = formatLogPre(config.format, ctx, start);
    console.log(preLog);

    await next();

    const ms = Date.now() - start;
    const status = ctx.response.statusCode || 200;

    let logLevel: string;
    if (status >= 500) logLevel = "error";
    else if (status >= 400) logLevel = "warn";
    else logLevel = "info";

    if (shouldLog(config.level, logLevel)) {
      const logEntry = formatLog(config.format, ctx, ms, status);
      console.log(logEntry);
    }
  };
};

function shouldLog(configLevel: string, messageLevel: string): boolean {
  const levels = { error: 0, warn: 1, info: 2 };
  return (
    levels[messageLevel as keyof typeof levels] <=
    levels[configLevel as keyof typeof levels]
  );
}

function getStatusColor(status: number): string {
  if (status >= 500) return "\x1b[31m"; // Red
  if (status >= 400) return "\x1b[33m"; // Yellow
  if (status >= 300) return "\x1b[36m"; // Cyan
  return "\x1b[32m"; // Green
}

function getResetColor(): string {
  return "\x1b[0m";
}

function formatLogPre(
  format: string,
  ctx: any,
  start: number,
): string | object {
  const timestamp = new Date().toISOString();
  const method = ctx.req.method;
  const url = ctx.req.url;
  const ip = ctx.req.socket.remoteAddress || "-";

  switch (format) {
    case "json":
      return JSON.stringify({
        timestamp,
        method,
        url,
        ip,
        event: "request_start",
        startTime: start,
      });
    case "dev":
      return `\x1b[36m${method} ${url} started${getResetColor()}`;
    case "short":
      return `${method} ${url} started`;
    default:
      return `[${timestamp}] ${method} ${url} started`;
  }
}

function formatLog(
  format: string,
  ctx: any,
  ms: number,
  status: number,
): string | object {
  const timestamp = new Date().toISOString();
  const method = ctx.req.method;
  const url = ctx.req.url;
  const userAgent = ctx.req.headers["user-agent"] || "-";
  const ip = ctx.req.socket.remoteAddress || "-";

  switch (format) {
    case "json":
      return JSON.stringify({
        timestamp,
        method,
        url,
        status,
        duration: ms,
        ip,
        userAgent,
        event: "request_end",
      });
    case "combined":
      return `${ip} - - [${timestamp}] "${method} ${url} HTTP/1.1" ${status} - "${userAgent}" ${ms}ms`;

    case "common":
      return `${ip} - - [${timestamp}] "${method} ${url} HTTP/1.1" ${status} -`;

    case "dev":
      const color = getStatusColor(status);
      return `${color}${method} ${url} ${status} ${ms}ms${getResetColor()}`;

    case "short":
      return `${method} ${url} ${status} ${ms}ms`;

    case "tiny":
      return `${method} ${url} ${status} - ${ms}ms`;

    default:
      return `[${timestamp}] ${method} ${url} ${status} ${ms}ms`;
  }
}
