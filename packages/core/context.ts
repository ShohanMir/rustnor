import { IncomingMessage, ServerResponse } from "http";
import { Request } from "../http/request";
import { Response } from "../http/response";
import { ParsedUrlQuery } from "querystring";

export type Context<StateT extends object = {}, BodyT = any> = {
  req: IncomingMessage;
  res: ServerResponse;
  request: Request<BodyT>;
  response: Response;
  app: any;
  query: ParsedUrlQuery;
  params: { [key: string]: string };
  state: StateT;
  [key: string]: any;
};

export type Middleware<StateT extends object = {}, BodyT = any> = (
  ctx: Context<StateT, BodyT>,
  next: () => Promise<any>,
) => Promise<void> | void;
