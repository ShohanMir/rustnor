import { IncomingMessage, ServerResponse } from "http";
import { Request } from "../http/request";
import { Response } from "../http/response";

export type Context = {
  req: IncomingMessage;
  res: ServerResponse;
  request: Request;
  response: Response;
  app: any;
  body?: any;
  status?: number;
  headers?: { [key: string]: string | string[] };
  query?: { [key: string]: string | string[] };
  params?: { [key: string]: string | string[] };
  cookies?: { [key: string]: string };
  state?: { [key: string]: any };
  [key: string]: any;
};

export type Middleware = (
  ctx: Context,
  next: () => Promise<any>,
) => Promise<void> | void;
