import { Middleware, Context } from "./context";
import Busboy from "busboy";
import querystring from "querystring";

export interface BodyParserOptions {
  limit?: number; // bytes, default 100KB
  strict?: boolean; // only JSON, default true
  multipart?: boolean;
  customParsers?: {
    multipart?: (ctx: Context, limit: number) => Promise<any>;
  };
}

const defaultOptions: Required<BodyParserOptions> = {
  limit: 1024 * 100, // 100KB
  strict: true,
  multipart: true,
  customParsers: {},
};

export const bodyParser = (options: BodyParserOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    if (
      ctx.req.method === "POST" ||
      ctx.req.method === "PUT" ||
      ctx.req.method === "PATCH"
    ) {
      const contentType = ctx.req.headers["content-type"] || "";
      let body: any = null;

      if (config.multipart && contentType.startsWith("multipart/form-data")) {
        try {
          const parser = config.customParsers?.multipart || parseMultipart;
          body = await parser(ctx, config.limit);
        } catch (err: any) {
          ctx.response.status(400);
          ctx.response.setHeader("Content-Type", "application/json");
          const errorBody = {
            error: "Invalid Multipart Data",
            message: err.message || "Failed to parse multipart body",
          };
          ctx.response.body = errorBody;
          ctx.res.writeHead(400, ctx.res.getHeaders());
          ctx.res.end(JSON.stringify(errorBody));
          return;
        }
      } else if (contentType.includes("application/json")) {
        try {
          body = await parseJson(ctx, config.limit);
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
      } else if (
        !config.strict &&
        contentType.includes("application/x-www-form-urlencoded")
      ) {
        try {
          body = await parseForm(ctx, config.limit);
        } catch (err: any) {
          ctx.response.status(400);
          ctx.response.setHeader("Content-Type", "application/json");
          const errorBody = {
            error: "Invalid Form Data",
            message: err.message || "Failed to parse form body",
          };
          ctx.response.body = errorBody;
          ctx.res.writeHead(400, ctx.res.getHeaders());
          ctx.res.end(JSON.stringify(errorBody));
          return;
        }
      }

      if (body !== null) {
        ctx.request.body = body;
      }
    }
    await next();
  };
};

async function parseJson(ctx: Context, limit: number): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;

    ctx.req.on("data", (chunk: Buffer) => {
      data += chunk.toString("utf8");
      size += chunk.length;
      if (size > limit) {
        ctx.req.destroy(
          new Error(`Request entity too large: ${size} > ${limit}`),
        );
        return;
      }
    });

    ctx.req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });

    ctx.req.on("error", reject);
  });
}

async function parseForm(
  ctx: Context,
  limit: number,
): Promise<Record<string, string | string[]>> {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;

    ctx.req.on("data", (chunk: Buffer) => {
      data += chunk.toString("utf8");
      size += chunk.length;
      if (size > limit) {
        ctx.req.destroy(
          new Error(`Request entity too large: ${size} > ${limit}`),
        );
        return;
      }
    });

    ctx.req.on("end", () => {
      try {
        const body = querystring.parse(data) as Record<
          string,
          string | string[]
        >;
        // Flatten string[] to string for single values
        if (body) {
          Object.keys(body).forEach((key) => {
            if (Array.isArray(body[key]) && body[key].length === 1) {
              body[key] = body[key][0];
            }
          });
        }
        resolve(body);
      } catch (err) {
        reject(err);
      }
    });

    ctx.req.on("error", reject);
  });
}

async function parseMultipart(ctx: Context, limit: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: ctx.req.headers,
      limits: { fileSize: limit, files: 10, fields: 100 },
    });
    const fields: { [key: string]: any[] } = {};
    const files: { [key: string]: any[] } = {};

    busboy.on("field", (fieldname: string, val: string) => {
      if (!fields[fieldname]) fields[fieldname] = [];
      fields[fieldname].push(val);
    });

    busboy.on(
      "file",
      (
        fieldname: string,
        file: any,
        filename: string,
        encoding: string,
        mimetype: string,
      ) => {
        const fileData: Buffer[] = [];
        file.on("data", (data: Buffer) => {
          fileData.push(data);
        });
        file.on("limit", () => {
          reject(new Error(`File size limit of ${limit} bytes exceeded.`));
        });
        file.on("end", () => {
          if (!files[fieldname]) files[fieldname] = [];
          files[fieldname].push({
            filename,
            encoding,
            mimetype,
            data: Buffer.concat(fileData),
          });
        });
      },
    );

    busboy.on("finish", () => {
      // Flatten single-item arrays to single values for backward compatibility
      Object.keys(fields).forEach((key) => {
        if (fields[key].length === 1) fields[key] = fields[key][0];
      });
      Object.keys(files).forEach((key) => {
        if (files[key].length === 1) files[key] = files[key][0];
      });
      resolve({ fields, files });
    });

    busboy.on("error", reject);

    ctx.req.pipe(busboy);
  });
}
