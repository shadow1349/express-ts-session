import { CookieModel } from "./cookie.model";
import { Request as HttpRequest } from "express";
import { StoreModel } from "./store.model";

export interface SessionDataModel {
  [propertyName: string]:
    | string
    | string[]
    | number
    | number[]
    | boolean
    | object
    | object[]
    | CookieModel;
}

export interface SessionModel extends SessionDataModel {
  /**
   * There will be 2 methods for data
   *
   *  - `get data()`
   *  - `set data(data: APISessionDataModel)`
   *
   * We want these methods because they do some scrubbing of the data in the class. For example, we don't
   * want things like the express.Request object that gets passed into the class because that will go
   * directly into the store.
   * @returns {SessionDataModel}
   */
  data: SessionDataModel;
  /**
   * This will save the curret session to the store.
   * @returns {void | Promise<void>}
   */
  save: () => void | Promise<void>;
  /**
   * This will reload the session from the store.
   * @returns {void | Promise<void>}
   */
  reload: () => void | Promise<void>;
  /**
   * This will destroy the session and delete the data from the store
   * @returns {void | Promise<void>}
   */
  destroy: () => void | Promise<void>;
  /**
   * This will touch the session indicating that a user has made a request to the API
   * and the cookie maxAge should be reset.
   * @returns {void | Promise<void>}
   */
  touch: () => void | Promise<void>;
  /**
   * This will reset the maxAge of the cookie
   * @returns {void}
   */
  resetMaxAge: () => void;
}

declare global {
  namespace Express {
    export interface Request {
      sessionId: string;
      session: SessionModel;
      sessionStore: StoreModel;
      genid: (req: HttpRequest) => string | Promise<string>;
      regenerateSession: (req: HttpRequest) => void | Promise<void>;
    }
  }
}
