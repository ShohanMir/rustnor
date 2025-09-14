import { Context, Middleware } from "./context";

export interface ErrorHandlerOptions {
  log?: boolean | ((err: any, ctx: Context) => void);
  html?: boolean | ((err: any, ctx: Context) => string);
  json?: boolean | ((err: any, ctx: Context) => object);
}

const defaultOptions: Required<ErrorHandlerOptions> = {
  log: true,
  html: (err, ctx) => {
    const isDev = process.env.NODE_ENV === "development";
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const stack = isDev && err.stack ? err.stack : "";

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error ${status}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #c00; }
          pre { background: #f0f0f0; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Error ${status}</h1>
        <p>${message}</p>
        ${stack ? `<pre>${stack}</pre>` : ""}
      </body>
      </html>
    `;
  },
  json: (err, ctx) => {
    const isDev = process.env.NODE_ENV === "development";
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const stack = isDev && err.stack ? err.stack : undefined;

    return {
      error: {
        status,
        message,
        stack,
      },
    };
  },
};

export const errorHandler = (options: ErrorHandlerOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    try {
      await next();
    } catch (err: any) {
      const status = err.status || err.statusCode || 500;
      ctx.response.status(status);

      // Logging
      if (config.log) {
        if (typeof config.log === "function") {
          config.log(err, ctx);
        } else {
          console.error(
            `[Error] ${ctx.req.method} ${ctx.req.url} - ${err.message}`,
          );
        }
      }

      // Response
      const accepts = ctx.req.headers["accept"] || "";
      if (accepts.includes("application/json") && config.json) {
        let body: any;
        if (typeof config.json === "function") {
          body = config.json(err, ctx);
        } else {
          body = (defaultOptions.json as (err: any, ctx: Context) => object)(
            err,
            ctx,
          );
        }
        ctx.response.setHeader("Content-Type", "application/json");
        ctx.response.send(JSON.stringify(body));
        ctx.res.end(ctx.response.body);
      } else if (accepts.includes("text/html") && config.html) {
        let body: any;
        if (typeof config.html === "function") {
          body = config.html(err, ctx);
        } else {
          body = (defaultOptions.html as (err: any, ctx: Context) => string)(
            err,
            ctx,
          );
        }
        ctx.response.setHeader("Content-Type", "text/html");
        ctx.response.send(body);
        ctx.res.end(ctx.response.body);
      } else {
        ctx.response.send(err.message || "Internal Server Error");
        ctx.res.end(ctx.response.body);
      }
    }
  };
};
