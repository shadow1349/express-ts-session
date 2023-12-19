import { Request } from "express";
import {
  CookieModel,
  DefaultCookieOptions,
  SessionDataModel,
  SessionModel,
  StoreModel,
} from "../models";

export class Session implements SessionModel {
  store: StoreModel;
  [propertyName: string]:
    | string
    | string[]
    | number
    | number[]
    | boolean
    | object
    | CookieModel;

  constructor(
    private req: Request,
    private sessionData: SessionDataModel = {}
  ) {
    if (!this.req.sessionId)
      throw new Error(
        "No session ID found on request object. Something has gone wrong with the session initialization, please try again."
      );

    this["id"] = this.req.sessionId;

    if (!this.req.sessionStore)
      throw new Error(
        "No store found on request object. Please make sure you have a store specified in the session middleware."
      );

    this.store = this.req.sessionStore;

    /**
     * If we have existing session data, we want to load it into the session object so it is accessible from the
     * req.session object.
     */
    this.data = this.sessionData;

    /**
     * We want to ensure that we always have a cookie set on the Session. By default the session middleware will
     * set the cookie to the options passed into the middleware OR the default options. This is more so to catch an edge case
     * since we should always have a cookie.
     */
    if (!this["cookie"]) {
      this["cookie"] = DefaultCookieOptions;
    }
  }

  /**
   * This will return the data object from the session. It will also scrub the data object to remove any
   * properties that we don't want to be saved to the store.
   *
   * @returns {SessionDataModel}
   */
  get data() {
    const keysToIgnore = ["req", "store", "sessionData"];

    const keys = Object.keys(this).filter(
      (key) => !keysToIgnore.includes(key)
    ) as (keyof SessionModel)[];

    return keys.reduce((acc, key) => {
      acc[key] = this[key];
      return acc;
    }, {} as SessionDataModel);
  }

  /**
   * This will fill data into the session. It takes an object and will iterate over the keys and values and set them
   * on the session object. We want to be able to pass data into this method, rather than accessing this.sessionData
   * directly because we want to be able to pass existing data from the store into this function.
   * @param {SessionDataModel} data
   */
  set data(data: SessionDataModel) {
    if (Object.keys(data).length > 0) {
      for (const propertyName in data) {
        this[propertyName] = data[propertyName];
      }
    }
  }

  save() {
    return this.store.set(this.req.sessionId, this.data);
  }

  async reload() {
    let existing = this.store.get(this.req.sessionId);

    if (existing instanceof Promise) existing = await existing;

    this.data = existing;
  }

  destroy() {
    return this.store.destroy(this.req.sessionId);
  }

  touch() {
    this.resetMaxAge();
  }

  resetMaxAge() {
    const cookie = this["cookie"] as CookieModel;
    cookie.maxAge = cookie.originalMaxAge;
  }
}
