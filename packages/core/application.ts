import http from "http";
import { Request } from "../http/request";
import { Response } from "../http/response";
import { compose } from "../utils/compose";
import { Context, Middleware } from "./context";

export class App {
  private middleware: Middleware[] = [];
  private errorHandler: ((err: any, ctx: Context) => void) | null = null;

  use(fn: Middleware) {
    this.middleware.push(fn);
    return this;
  }

  onError(fn: (err: any, ctx: Context) => void) {
    this.errorHandler = fn;
  }

  listen(...args: any[]) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }

  getListener() {
    return this.callback();
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
    const response = new Response(res);
    const request = new Request(req);
    const context: Context = {
      req,
      res,
      app: this,
      request,
      response,
      query: request.query,
      params: {},
      state: {},
    };
    return context;
  }

  private handleRequest(
    ctx: Context,
    fnMiddleware: (ctx: Context, next?: () => Promise<any>) => Promise<any>,
  ) {
    const handleResponse = () => respond(ctx);
    const onError = (err: any) => {
      if (this.errorHandler) {
        this.errorHandler(err, ctx);
      } else {
        this.defaultErrorHandler(err, ctx);
      }
      respond(ctx);
    };

    return fnMiddleware(ctx).then(handleResponse).catch(onError);
  }

  private defaultErrorHandler(err: any, ctx: Context) {
    console.error("[App Error]", err);
    ctx.response.status(500).json({ message: "Internal Server Error" });
  }
}

function respond(ctx: Context) {
  const { res, response } = ctx;
  if (response.res.headersSent) {
    return;
  }

  if (!response.body) {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }

  const body = response.body;
  if (typeof body === "string") {
    res.end(body);
  } else if (typeof body === "object" && body !== null) {
    res.end(JSON.stringify(body));
  } else {
    res.end(String(body));
  }
}