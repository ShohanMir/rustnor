import { ServerResponse } from "http";

export type Response = {
  res: ServerResponse;
  [key: string]: any;
};