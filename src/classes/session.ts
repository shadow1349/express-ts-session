import { Request } from "express";
import {
  CookieModel,
  SessionDataModel,
  SessionModel,
  StoreModel,
} from "../models";
import { uuid } from "../util";
import { Cookie } from "./cookie";
import { Store } from "./store";

export class Session implements SessionModel {
  id: string;
  cookie: CookieModel;
  [propertyName: string]: string | number | boolean | object;

  private sessionStore: StoreModel;

  constructor(private req: Request, private data: SessionDataModel = {}) {
    this.id = this.req.sessionId;

    if (this.data.cookie) this.cookie = this.data.cookie as CookieModel;
    else this.cookie = new Cookie({});

    if (!this.req.sessionStore) this.req.sessionStore = new Store(() => uuid());

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
