import { IncomingMessage, ServerResponse } from "http";
import { Request } from "../http/request";
import { Response } from "../http/response";
import { ParsedUrlQuery } from "querystring";

export type Context = {
  req: IncomingMessage;
  res: ServerResponse;
  request: Request;
  response: Response;
  app: any;
  query: ParsedUrlQuery;
  params: { [key: string]: string };
  state: { [key: string]: any };
  [key: string]: any;
};

export type Middleware = (
  ctx: Context,
  next: () => Promise<any>,
) => Promise<void> | void;