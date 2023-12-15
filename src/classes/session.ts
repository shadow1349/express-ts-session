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

  constructor(
    private req: Request,
    private sessionData: SessionDataModel = {}
  ) {
    this.id = this.req.sessionId;

    if (this.sessionData.cookie)
      this.cookie = this.sessionData.cookie as Cookie;
    else this.cookie = new Cookie({});

    if (!this.req.sessionStore) this.req.sessionStore = new Store(() => uuid());

    this.sessionStore = this.req.sessionStore;

    /**
     * If there is data in the session, set it to the session
     */
    if (Object.keys(this.sessionData).length > 0) {
      for (const propertyName in this.sessionData) {
        this[propertyName] = this.sessionData[propertyName];
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
    this.sessionStore.set(this.id, this.sessionData);
  }

  async regenerate() {
    await this.req.sessionStore.regenerate(this.req);
  }

  async destroy() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete this.req.session;
    await this.sessionStore.destroy(this.id);
  }

  async reload() {
    const existing = await this.sessionStore.get(this.id);

    if (existing && this.sessionStore.createSession)
      await this.sessionStore?.createSession(this.req, existing);
  }

  data(): SessionDataModel {
    const keys = Object.keys(this);

    const data = keys.reduce<SessionDataModel>((acc, propertyName) => {
      // We don't need req, sessionData, or sessionStore since those aren't part of the data
      if (
        propertyName === "req" ||
        propertyName === "sessionData" ||
        propertyName === "sessionStore" ||
        propertyName === "cookie"
      )
        return acc;
      acc[propertyName] = this[propertyName];
      return acc;
    }, {});

    return data;
  }
}
