import { Session, Store } from "../classes";
import { CookieDataModel } from "./cookie.model";
import { Request as HttpRequest } from "express";

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
  data: () => SessionDataModel;
}

declare global {
  namespace Express {
    export interface Request {
      sessionId: string;
      session: Session;
      sessionStore: Store;
      genid: (req: HttpRequest) => string | Promise<string>;
    }
  }
}
