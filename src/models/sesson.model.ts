import { Request } from "express";
import { CookieDataModel, CookieModel } from "./cookie.model";
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
  session: SessionModel;
}

export interface SessionDataModel {
  [propertyName: string]: string | number | boolean | object | CookieDataModel;
}

export interface SessionModel extends SessionDataModel {
  touch: () => void;
  save: () => void | Promise<void>;
  resetMaxAge: () => void;
  reload: () => void | Promise<void>;
  regenerate: () => void | Promise<void>;
  destroy: () => void | Promise<void>;
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
