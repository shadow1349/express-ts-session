import { Request } from "express";
import { CookieModel } from "./cookie.model";
import { StoreModel } from "./store.model";

export type UnsetType = "destroy" | "keep";

export interface SessionOptionsModel {
  cookie: CookieModel;
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

export interface SessionDataModel {
  [propertyName: string]: string | number | boolean | object;
}

export interface SessionModel extends SessionDataModel {
  id: string;
  cookie: CookieModel;
  touch: () => void;
  save: () => void;
  resetMaxAge: () => void;
  reload: () => void;
  regenerate: () => void;
  destroy: () => void;
}

declare global {
  namespace Express {
    export interface Request {
      sessionId: string;
      session: SessionModel;
      sessionStore: StoreModel;
    }
  }
}
