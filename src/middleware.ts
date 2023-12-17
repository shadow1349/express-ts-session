import * as crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import onHeaders from "on-headers";
import { Cookie, Session, Store } from "./classes";
import {
  CookieModel,
  MiddlewareOptionsModel,
  SessionDataModel,
  UnsetType,
} from "./models";
import { MemoryStore } from "./stores/memory/memory.store";
import { parse, sign, unsign, uuid } from "./util";

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
  private end?: {
    (cb?: (() => void) | undefined): Response<any, Record<string, any>>;
    (chunk: any, cb?: (() => void) | undefined): Response<
      any,
      Record<string, any>
    >;
    (
      chunk: any,
      encoding: BufferEncoding,
      cb?: (() => void) | undefined
    ): Response;
  };

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
    // If we have an existing session we can just go next
    if (req.session) return next();

    // We will override the end method to intercept when a request is finished
    this.end = res.end;
    res.end = this.endMethod(req, res) as any;

    // We will check the headers and set the cookie if needed
    onHeaders(res, () => {
      if (!req.session) {
        console.debug("There is no session");
        return;
      }

      if (!this.shouldSetCookie(req)) return;

      if (req.session.cookie.secure && !this.isSecure(req)) {
        console.debug("The cookie is secure but the request is not");
        return;
      }

      if (!this.touched) {
        req.session.touch();
        this.touched = true;
      }

      this.setCookie(req, res);
    });

    // We will set the store on the request
    req.sessionStore = this.store;

    // This will set the sessionID from the cookie if it exists.
    this.cookieId = req.sessionId = this.getCookie(req) || "";

    // This will generate a brand new session ID if one does not exist.
    if (!req.sessionId) {
      this.store.generate(req);
      this.originalId = req.sessionId;
      this.originalHash = this.hash(req.session);
      next();
      return;
    }

    // If there is a req.sessionId we will try and grab the session from the store
    const existingSession = this.store.get(req.sessionId);

    // We need to check if we get a promise from the store or not
    if (existingSession instanceof Promise) {
      // If we get a promise then we will call the .then method
      existingSession
        .then((session) => {
          this.inflateSession(req, session);
          next();
          return;
        })
        .catch((err) => {
          // Go next with the error
          next(err);
          return;
        });
      return;
    } else {
      this.inflateSession(req, existingSession);
      next();
      return;
    }
  };

  /**
   * When a request is finished, this will handle the saving of the session.
   * @param {Request} req
   * @param {Response} res
   */
  private endMethod = (req: Request, res: Response) => {
    return (chunk: any, encoding?: BufferEncoding | (() => void)) => {
      // Nothing to do here
      if (!req.session)
        return this.end?.apply(res, [chunk, encoding as BufferEncoding]);

      if (this.shouldSaveSession(req)) {
        this.store.set(req.sessionId, req.session.data());
      } else if (
        this.shouldTouchSession(req) &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        typeof this.store?.touch === "function" &&
        !this.touched
      ) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.store?.touch(req.sessionId, req.session.data());
        this.touched = true;
      }

      return this.end?.apply(res, [chunk, encoding as BufferEncoding]);
    };
  };

  /**
   * This will inflate an existing session using
   * the data retrieved from the store.
   *
   * @param {Request} req
   * @param {SessionDataModel} sessionData
   */
  private inflateSession(req: Request, sessionData: SessionDataModel) {
    req.session = this.store.createSession(req, sessionData);
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

    req.session = new Session(req);
    req.session.cookie = this.cookie;

    if (this.cookie.secure === "auto")
      req.session.cookie.secure = this.isSecure(req);
  }

  /**
   * This will tell us if the request is secure or not
   * @param {Request} req
   * @returns {boolean}
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

  /**
   * If the session should be destroyed or not
   * @param {Request} req
   * todo implement destroy method
   */
  private shouldDestroySession(req: Request) {
    return req.sessionId && this.unset === "destroy" && !req.session;
  }

  /**
   * If the session should be saved or not
   * @param {Request} req
   * @returns {boolean}
   */
  private shouldSaveSession(req: Request) {
    if (!req.session) return false;

    if (
      this.saveUninitialized &&
      !this.savedHash &&
      this.cookieId !== req.sessionId
    ) {
      return this.isModified(req.session);
    } else {
      return this.isSaved(req);
    }
  }

  /**
   * If we should run the touch method on the session
   * @param {Request} req
   * @returns {boolean}
   */
  private shouldTouchSession(req: Request) {
    if (typeof req.sessionId !== "string") return false;

    return this.cookieId === req.sessionId && !this.shouldSaveSession(req);
  }

  /**
   * If the session has been saved or not. It will compare the original session ID
   * along with the hashes of the original session and the current session.
   * @param {Request} req
   * @returns {boolean}
   */
  private isSaved(req: Request) {
    return (
      this.originalId === req.sessionId ||
      this.savedHash === this.hash(req.session)
    );
  }

  /**
   * Will help to tell if the session has been modified. We will compare the hashes
   * of the original session and the current session along with the originalID and the
   * current session id
   * @param {SessionDataModel} session
   * @returns {boolean}
   */
  private isModified(session: Session) {
    return (
      this.originalId !== session.id || this.originalHash !== this.hash(session)
    );
  }

  /**
   * A helpful utility to tell us if the cookie should be set
   * on the response.
   * @param {Request} req
   * @returns {boolean}
   */
  private shouldSetCookie(req: Request) {
    if (typeof req.sessionId !== "string") return false;

    return this.cookieId !== req.sessionId
      ? this.saveUninitialized || this.isModified(req.session)
      : this.rolling ||
          ((req.session.cookie as CookieModel).expires !== null &&
            this.isModified(req.session));
  }

  /**
   * This function will retrieve the cookie from the request if
   * it exists.
   *
   * @param {Request} req
   * @returns {string | undefined}
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
        } else {
          val = raw;
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
        } else {
          val = raw;
        }
      }
    }

    return val;
  }

  /**
   * Sets the cookie on the header
   * @param {Request} req
   * @param {Response} res
   */
  private setCookie(req: Request, res: Response) {
    const signed = "s:" + sign(req.sessionId, this.secret[0]);

    const shouldSign = this.opts.cookie?.signed === true;

    const data = this.cookie.serialize(
      this.name,
      shouldSign ? signed : req.sessionId
    );

    const prev = res.getHeader("Set-Cookie") || [];
    const header = Array.isArray(prev) ? prev.concat(data) : [prev, data];
    res.setHeader("Set-Cookie", header as string[]);
  }

  /**
   *
   * @param {string} val
   * @param {string[]} secrets
   * @returns {string | undefined}
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
   * Creates a hash of the session object
   * @param {SessionDataModel} sess
   * @returns {string}
   */
  private hash(sess: Session) {
    const data = sess.data();

    const str = JSON.stringify(data);

    return crypto.createHash("sha256").update(str, "utf8").digest("hex");
  }
}
