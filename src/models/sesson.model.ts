import { NextFunction, Request, Response } from "express";
import { CookieOptionsModel } from "./cookie.model";
import { StoreModel } from "./store.model";

export type UnsetType = "destroy" | "keep";

export interface SessionOptionsModel {
  cookie: any;
  genid: (req: Request) => string | Promise<string>;
  name: string;
  proxy: boolean;
  resave: boolean;
  rolling: boolean;
  saveUninitialized: boolean;
  secret: string | string[];
  store: StoreModel;
  unset: UnsetType;
}

export interface SessionModel {
  options: SessionOptionsModel;
  session: (req: Request, res: Response, next: NextFunction) => void;
}

export interface SessionDataModel {
  id: string;
  cookie: CookieOptionsModel;
  [propertyName: string]: string | number | boolean | object;
  touch: () => void;
  save: () => void;
  resetMaxAge: () => void;
  reload: () => void;
  regenerate: () => void;
}

// export interface SessionRequestModel extends Request {
//   sessionId: string;
//   session: SessionDataModel;
// }

declare global {
  namespace Express {
    export interface Request {
      sessionId: string;
      session: SessionDataModel;
    }
  }
}
