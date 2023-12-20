import * as crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import onHeaders from "on-headers";
import {
  CookieModel,
  DefaultCookieOptions,
  MiddlewareOptionsModel,
  SessionDataModel,
  SessionModel,
  StoreModel,
} from "./models";
import { Session } from "./session";
import { parse, serialize, sign, unsign, uuid } from "./util";
import { MemoryStore } from "./stores";

export class ExpressTSSession implements MiddlewareOptionsModel {
  cookie: CookieModel;
  genid: (req: Request) => string | Promise<string>;
  name: string;
  secret: string;
  store: StoreModel;
  overwriteSession: boolean;
  saveInitialSession: boolean;

  /**
   * This is a hash of the session data that we get initially
   * before the request gets to the API.
   */
  private existingHash?: string;
  /**
   * This is the ID of the session that we get initially
   * before the request gets to the API
   */
  private existingId?: string;
  /**
   * This is a function that will be called when the request ends
   */
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
      throw new Error("You must provide a secret to the session middleware");

    this.cookie = this.opts.cookie || DefaultCookieOptions;
    this.genid = this.opts.genid || this.generateSessionID;
    this.name = this.opts.name || "session.sid";
    this.secret = this.opts.secret;
    this.store = this.opts.store || new MemoryStore();

    if (this.opts.saveInitialSession === undefined)
      this.saveInitialSession = true;
    else this.saveInitialSession = this.opts.saveInitialSession;

    if (this.opts.overwriteSession === undefined) this.overwriteSession = false;
    else this.overwriteSession = this.opts.overwriteSession;
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
    req.genid = this.genid;
    req.regenerateSession = this.regenerateSession;

    // If we have an existing session for some reason then we can just move on
    if (req.session && req.sessionId) {
      next();
      return;
    }

    /**
     * We're going to set res.end to this class so that we can call it later when our
     * override method is done
     */
    this.end = res.end;
    res.end = this.endMethod(req, res) as any;

    /**
     * On headers will be called when the response headers are being set. This is where we will
     * handle sending the cookie
     */
    onHeaders(res, this.handleOnHeaders(req, res));

    /**
     * We will try to get the session ID from the cookie. If it exists then we will try to get the
     * session data from the store. If it doesn't exist then we will create a new session.
     */
    try {
      const existingSessionId = this.getCookie(req);

      /**
       * If we are recalling a session then genid will return the existing session ID
       * from the database so we'll wantto call that in the case we are recalling a session.
       *
       * If genid fails then genid will do its job and generate a new session ID.
       */
      if (existingSessionId) {
        req.sessionId = existingSessionId;
        const existingData = await this.store.get(existingSessionId);
        await this.generateSession(req, existingData);
        next();
        return;
      } else {
        await this.generateSession(req);
        next();
        return;
      }
    } catch (error) {
      await this.generateSession(req);
      next();
      return;
    }
  };

  /**
   * This will handling creating a new session either off of an existing one
   * or just a brand new session
   *
   * @param {Request} req
   * @param {SessionDataModel} data
   */
  private async generateSession(req: Request, data?: SessionDataModel) {
    if (!req.sessionId) {
      const newSessionId = this.genid(req);
      // Set the sessionId on the request object
      if (newSessionId instanceof Promise) req.sessionId = await newSessionId;
      else req.sessionId = newSessionId;
    }

    // Set the store on the reques object
    req.sessionStore = this.store;
    // Create a new session and save it on the request
    const session = new Session(req, data);

    session.cookie = this.cookie;
    req.session = session;

    /**
     * If there is no existing data then it's a pretty safe bet that this is the first request of
     * the session. Then we want to check for the saveInitialSession option and if it's true then
     * we'll save the session to the database.
     */
    if (!data && this.saveInitialSession)
      // We're going to save our initial session to the database.
      req.session.save();

    this.existingHash = this.hash(session);
    this.existingId = req.sessionId;
  }

  /**
   * This will handle regenerating the session. It will create a new session and
   * delete the old one.
   * @param {Request} req
   */
  private regenerateSession = async (req: Request) => {
    // If we want to overwrite on regenerate then we need to destroy the existing session in the database
    if (this.overwriteSession) req.session.destroy();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete req.session;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete req.sessionId;

    await this.generateSession(req);
  };

  /**
   * Generate a session ID for the session cookie.
   * @returns {string}
   */
  private generateSessionID(): string {
    return uuid();
  }

  /**
   * This will handle setting the cookie when the headers are being set.
   * @param {Request} req
   * @param {Response} res
   */
  private handleOnHeaders(req: Request, res: Response) {
    return () => {
      /**
       * At this point if we have no session then there's nothing to do
       */
      if (!req.session) return;

      /**
       * Grab the existing cookie options from the session
       */
      const sessionCookie = req.session.cookie as CookieModel;

      /**
       * If the cookie is only meant to be used with HTTPS requests and
       * we have a non-secure request then we don't want to set the cookie
       */
      if (sessionCookie.secure && !this.isSecureRequest(req)) return;

      this.setCookie(req, res);
    };
  }

  /**
   * When a request is finished, this will handle the saving of the session.
   * @param {Request} req
   * @param {Response} res
   */
  private endMethod = (req: Request, res: Response) => {
    return (chunk: any, encoding?: BufferEncoding | (() => void)) => {
      // There is nothing to do here if there is no session by the end of the request
      if (!req.session)
        return this.end?.apply(res, [chunk, encoding as BufferEncoding]);

      // If the session has altered from the original then we should save it
      if (this.shouldSaveSession(req)) req.session.save();

      // This will check if the session is undefined or null and if we have a sessionid then we should destroy the session
      if (this.shouldDestroySession(req)) this.store.destroy(req.sessionId);

      return this.end?.apply(res, [chunk, encoding as BufferEncoding]);
    };
  };

  /**
   * This will take a hash of the new session and compare it to the existing hash
   * to tell us if we should save the session or not.
   * @param {APISessionModel} session
   * @returns {boolean}
   */
  private shouldSaveSession(req: Request) {
    // If we don't have a session then there's nothing to do
    if (!req.session || !req.sessionId) return false;

    const newHash = this.hash(req.session);

    if (newHash !== this.existingHash) return true;

    return false;
  }

  /**
   * If the session is undefined but we have a session ID then we should destroy the session
   * @param {Request} req
   * @returns
   */
  private shouldDestroySession(req: Request) {
    return req.sessionId && !req.session;
  }

  /**
   * This will tell us if the request is coming from a secure connection or not.
   * @param {Request} req
   * @returns {boolean}
   */
  private isSecureRequest(req: Request) {
    if (req.secure && req.protocol === "https") return true;

    // TODO: implement proxy secure later
    // if (this.proxy !== undefined)
    //   return this.proxy ? (req.secure = true) : false;

    const header = req.headers["x-forwarded-proto"] || "";
    const index = header.indexOf(",");
    const proto =
      index !== -1
        ? (header as string).substring(0, index).toLowerCase()
        : header;

    return proto === "https";
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
          const unsigned = unsign(raw.slice(2), this.secret);
          if (typeof unsigned === "string") val = unsigned;
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
          const unsigned = unsign(raw.slice(2), this.secret);
          if (typeof unsigned === "string") val = unsigned;
        } else {
          val = raw;
        }
      }
    }

    return val;
  }

  /**
   * Sets the cookie on the header. This will always sign the cookie with the secret.
   * We will always sign the cookies.
   * @param {Request} req
   * @param {Response} res
   */
  private setCookie(req: Request, res: Response) {
    const signed = "s:" + sign(req.sessionId, this.secret);
    const data = serialize(this.name, signed, this.cookie);
    const prev = res.getHeader("Set-Cookie") || [];
    const header = Array.isArray(prev) ? prev.concat(data) : [prev, data];
    res.setHeader("Set-Cookie", header as string[]);
  }

  /**
   * Creates a hash of the session object
   * @param {SessionDataModel} sess
   * @returns {string}
   */
  private hash(sess: SessionModel) {
    const str = JSON.stringify(sess.data);

    return crypto.createHash("sha256").update(str, "utf8").digest("hex");
  }
}
