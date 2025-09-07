import { Middleware } from "./context";
import { createGzip, createDeflate } from "zlib";

export interface CompressOptions {
  threshold?: number; // Minimum response size to compress (bytes)
  level?: number; // Compression level (1-9)
  types?: string[]; // Content types to compress
  encodings?: string[]; // Accepted encodings
}

const defaultOptions: Required<CompressOptions> = {
  threshold: 1024, // 1KB
  level: 6,
  types: [
    "text/plain",
    "text/css",
    "text/html",
    "text/javascript",
    "application/javascript",
    "application/json",
    "application/xml",
    "application/xml+rss",
    "image/svg+xml",
  ],
  encodings: ["gzip", "deflate"],
};

export const compress = (options: CompressOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    await next();

    const acceptEncoding = ctx.req.headers["accept-encoding"] as string;
    if (!acceptEncoding) return;

    const contentType = ctx.res.getHeader("content-type") as string;
    if (!contentType || !shouldCompress(contentType, config.types)) return;

    const body = ctx.response.body;
    if (
      !body ||
      typeof body !== "string" ||
      Buffer.byteLength(body) < config.threshold
    )
      return;

    const encoding = getBestEncoding(acceptEncoding, config.encodings);
    if (!encoding) return;

    // Compress the response
    const compressed = await compressBody(body, encoding, config.level);

    ctx.response.setHeader("Content-Encoding", encoding);
    ctx.response.setHeader("Vary", "Accept-Encoding");
    ctx.res.removeHeader("Content-Length"); // Remove content-length as it's now compressed

    ctx.response.body = compressed;
  };
};

function shouldCompress(contentType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => contentType.includes(type));
}

function getBestEncoding(
  acceptEncoding: string,
  supportedEncodings: string[],
): string | null {
  const encodings = acceptEncoding
    .split(",")
    .map((enc) => enc.trim().split(";")[0]);

  for (const encoding of supportedEncodings) {
    if (encodings.includes(encoding)) {
      return encoding;
    }
  }

  return null;
}

function compressBody(
  body: string,
  encoding: string,
  level: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(body);
    let compressor;

    if (encoding === "gzip") {
      compressor = createGzip({ level });
    } else if (encoding === "deflate") {
      compressor = createDeflate({ level });
    } else {
      reject(new Error(`Unsupported encoding: ${encoding}`));
      return;
    }

    const chunks: Buffer[] = [];

    compressor.on("data", (chunk) => chunks.push(chunk));
    compressor.on("end", () => resolve(Buffer.concat(chunks)));
    compressor.on("error", reject);

    compressor.write(buffer);
    compressor.end();
  });
}
