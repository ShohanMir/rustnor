import http from "http";
import { Request } from "../http/request";
import { Response } from "../http/response";
import { compose } from "../utils/compose";
import { Context, Middleware } from "./context";

export class App {
  private middleware: Middleware[] = [];

  use(fn: Middleware) {
    this.middleware.push(fn);
    return this;
  }

  listen(...args: any[]) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }

  private callback() {
    const fn = compose(this.middleware);

    const handleRequest = (
      req: http.IncomingMessage,
      res: http.ServerResponse,
    ) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
  }

  private createContext(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Context {
    const context: Context = {
      req,
      res,
      app: this,
      request: { req },
      response: { res },
    };
    return context;
  }

  private handleRequest(
    ctx: Context,
    fnMiddleware: (ctx: Context) => Promise<any>,
  ) {
    const handleResponse = () => respond(ctx);
    const onError = (err: any) => this.handleError(err, ctx);

    return fnMiddleware(ctx).then(handleResponse).catch(onError);
  }

  private handleError(err: any, ctx: Context) {
    ctx.res.statusCode = 500;
    ctx.res.end("Internal Server Error");
    console.error("[App Error]", err);
  }
}

function respond(ctx: Context) {
  if (ctx.body) {
    ctx.res.statusCode = ctx.status || 200;
    ctx.res.end(
      typeof ctx.body === "string" ? ctx.body : JSON.stringify(ctx.body),
    );
  } else {
    ctx.res.statusCode = 404;
    ctx.res.end("Not Found");
  }
}
