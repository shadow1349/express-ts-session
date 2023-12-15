import * as crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { Cookie, Session, Store } from "./classes";
import {
  CookieModel,
  MiddlewareOptionsModel,
  SessionDataModel,
  UnsetType,
} from "./models";
import { MemoryStore } from "./stores/memory.store";
import { parse, unsign, uuid } from "./util";

export class ExpressTSSession implements MiddlewareOptionsModel {
  cookie: Cookie;
  genid: (req: Request) => string | Promise<string>;
  name: string;
  proxy?: boolean;
  resave: boolean;
  rolling: boolean;
  saveUninitialized: boolean;
  secret: string | string[];
  store: Store;
  unset: UnsetType;

  private originalId?: string;
  private originalHash?: string;
  private savedHash?: string;
  private touched: boolean = false;
  private cookieId?: string;
  private session?: Session;

  constructor(private opts: MiddlewareOptionsModel) {
    if (!opts.secret)
      throw new Error("You must provide a secret to express-ts-session");

    if (!opts.saveUninitialized)
      console.warn(
        "saveUninitialized is not set, the default will be set to true"
      );

    if (!opts.resave)
      console.warn("resave is not set, the default will be set to true");

    this.secret = this.opts.secret;
    this.cookie = this.opts.cookie || new Cookie({});
    this.genid = this.opts.genid || uuid;
    this.name = this.opts.name || "connect.sid";
    this.proxy = this.opts.proxy;
    this.resave = this.opts.resave || true;
    this.rolling = this.opts.rolling || true;
    this.saveUninitialized = this.opts.saveUninitialized || true;
    this.store = this.opts.store || new MemoryStore();
    this.unset = this.opts.unset || "keep";

    if (!Array.isArray(this.secret)) this.secret = [this.secret];
    if (Array.isArray(this.secret) && this.secret.length === 0)
      throw new Error("You must provide a secret to express-ts-session");

    if (this.store.generate === undefined)
      this.store.generate = this.generateNewSession;
  }

  /**
   * This is the heart of the middelware. It should be called on every request.
   * It will handle the creation of the session object and the setting of the session ID cookie.
   *
   * If you are trying to override this method in a custom class, then make sure that you you use fat
   * arrows like this:
   *
   * init = (req: Request, res: Response, next: NextFunction) => {...}
   *
   * Otherwise when you try to call things in the class like this.name it will be undefined.
   *
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  init = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session) return next();

    req.sessionStore = this.store;

    /**
     * This will set the sessionID from the cookie if it exists.
     */
    this.cookieId = req.sessionId = this.getCookie(req) || "";

    /**
     * This will generate a brand new session ID if one does not exist.
     */
    if (!req.sessionId) {
      this.store.generate(req);
      this.originalId = req.sessionId;
      this.originalHash = this.hash(req.session);
      next();
      return;
    }

    const existingSession = this.store.get(req.sessionId);

    if (existingSession instanceof Promise) {
      existingSession
        .then((session) => {
          this.inflateSession(req, session);
          next();
          return;
        })
        .catch((err) => {
          throw err;
        });
      return;
    } else {
      this.inflateSession(req, existingSession);
      next();
      return;
    }
  };

  /**
   * This will inflate an existing session using
   * the data retrieved from the store.
   *
   * @param {Request} req
   * @param {SessionDataModel} sessionData
   */
  private inflateSession(req: Request, sessionData: SessionDataModel) {
    this.session = this.store.createSession(req, sessionData);
    this.originalId = req.sessionId;
    this.originalHash = this.hash(req.session);

    if (!this.resave) {
      this.savedHash = this.originalHash;
    }
  }

  /**
   * This will generate a new session
   * @param {Request} req
   */
  private async generateNewSession(req: Request) {
    const newSessionId = this.genid(req);

    if (typeof newSessionId === "string") req.sessionId = newSessionId;
    else req.sessionId = await newSessionId;

    this.session = new Session(req);

    req.session = this.session;
    req.session["cookie"] = this.cookie;

    if (this.cookie.secure === "auto")
      (req.session["cookie"] as CookieModel).secure = this.isSecure(req);
  }

  /**
   * This will tell us if the request is secure or not
   * @param {Request} req
   * @returns
   */
  private isSecure(req: Request) {
    if (req.secure && req.protocol === "https") return true;

    if (this.proxy !== undefined)
      return this.proxy ? (req.secure = true) : false;

    const header = req.headers["x-forwarded-proto"] || "";
    const index = header.indexOf(",");
    const proto =
      index !== -1
        ? (header as string).substring(0, index).toLowerCase()
        : header;

    return proto === "https";
  }

  private shouldSetCookie(req: Request) {
    if (typeof req.sessionId !== "string") return false;

    return true;
  }

  /**
   * This function will retrieve the cookie from the request if
   * it exists.
   *
   * @param {Request} req
   * @returns
   */
  private getCookie(req: Request): string | undefined {
    const header = req.headers.cookie;
    let raw: string, val: string | undefined;

    if (header) {
      const cookies = parse(header);
      raw = cookies[this.name];

      if (raw) {
        if (raw.substring(0, 2) === "s:") {
          val = this.unsignCookie(raw.slice(2), this.secret as string[]);
        }
      }
    }

    if (!val && req.signedCookies) {
      val = req.signedCookies[this.name];
    }

    if (!val && req.cookies) {
      raw = req.cookies[this.name];

      if (raw) {
        if (raw.substring(0, 2) === "s:") {
          val = this.unsignCookie(raw.slice(2), this.secret as string[]);
        }
      }
    }

    return val;
  }

  /**
   *
   * @param {string} val
   * @param {string[]} secrets
   * @returns
   */
  private unsignCookie(val: string, secrets: string[]) {
    for (let i = 0; i < secrets.length; i++) {
      const result = unsign(val, secrets[i]);

      // unsign will only ever return false if the signature does not match
      // so if it's not false it will always be a string
      if (result !== false) return result as string;
    }

    return undefined;
  }

  /**
   *
   * @param {SessionDataModel} sess
   * @returns
   */
  private hash(sess: SessionDataModel) {
    const str = JSON.stringify(sess, (key, val) => {
      if (key !== "cookie") return;
      return val;
    });

    return crypto.createHash("sha256").update(str, "utf8").digest("hex");
  }
}
