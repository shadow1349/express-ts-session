
import { CookieDataModel } from "./cookie.model";
import { StoreModel } from "./store.model";

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
