import { Request } from "express";
import { CookieModel, StoreModel } from "../models";

export type UnsetType = "destroy" | "keep";

export interface MiddlewareOptionsModel {
  /**
   * The cookie options object is used to set properties for the session cookie. This will
   * dictate the how the server will send the session cookies and how they will be used on
   * the client.
   * @optional
   * @type {CookieModel}
   */
  cookie?: CookieModel;
  /**
   * Pass in a function that should return a globally unique ID for the session.
   * By default this will generate a UUID for you so if that satisfies your use case there shouldn't
   * be any need to modify it. If you do modify it, make sure the returned value is unique as
   * collisions will overwrite existing sessions in the database.
   * @optional
   * @param {Request} req
   * @type {(req: Request) => string | Promise<string>}
   * @default uuid()
   * @returns {string | Promise<string>}
   */
  genid?: (req: Request) => string | Promise<string>;
  /**
   * The name of the session ID cookie to set in the response (and read from in the request).
   * @optional
   * @type {string}
   * @default 'session.sid'
   */
  name?: string;
  /**
   * The secret is a string value that will be used to compute the hash in the session ID cookie. Please choose
   * a secure value for this option and ensure that it will be static. Ideally using a randomly-generated string.
   * It would also be good practice to make sure that each environment has a different secret.
   *
   * *WARNING:* If you change this value after your API is live, all existing sessions will be invalidated.
   *
   * @type {string}
   * @required
   */
  secret: string;
  /**
   * The store is a class that will handle session data in a database. There is no default store so you will need
   * to provide one. You can create your own store if you want, as they only implement 3 methods, get, set, and destroy.
   *
   * @optional
   * @default MemoryStore
   * @type {StoreModel}
   */
  store?: StoreModel;
  /**
   * This will handle if the session is deleted in the database or not. By default, regenerate will delete the session
   * on the request and create a new one.
   *
   * - `true` will delete the current session in the database and create a new one
   * - `false` will keep the current session in the database and create a new one
   *
   * @optional
   * @default false
   * @type {boolean}
   */
  overwriteSession?: boolean;
  /**
   * This will ensure that a session is saved to the database on the first request. This is useful if you want to
   * ensure that a session is created for a user on their first request to the API.
   * @optional
   * @default true
   * @type {boolean}
   */
  saveInitialSession?: boolean;
}
