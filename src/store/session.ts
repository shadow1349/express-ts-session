import { Request } from "express";
import {
  CookieModel,
  SessionDataModel,
  SessionModel,
  StoreModel,
} from "../models";

export class Session implements SessionModel {
  id: string;
  cookie: CookieModel;
  [propertyName: string]: string | number | boolean | object;

  private sessionStore: StoreModel;

  constructor(private req: Request, private data: SessionDataModel = {}) {
    this.id = this.req.sessionId;
    this.cookie = req.session.cookie;

    if (!this.req.sessionStore)
      throw new TypeError(
        "Session store is not defined on the request object."
      );

    this.sessionStore = this.req.sessionStore;

    if (Object.keys(this.data).length > 0) {
      for (const propertyName in this.data) {
        this[propertyName] = this.data[propertyName];
      }
    }
  }

  touch() {
    this.resetMaxAge();
  }

  resetMaxAge() {
    this.cookie.maxAge = this.cookie.originalMaxAge;
  }

  save() {
    this.sessionStore.set(this.id, this.data);
  }

  regenerate() {}

  destroy() {}

  reload() {}
}
