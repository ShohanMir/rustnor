import { IncomingMessage } from "http";

export type Request = {
  req: IncomingMessage;
  [key: string]: any;
};