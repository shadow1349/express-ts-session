import { NextFunction, Request, Response } from "express";
import { Cookie, Store } from "./classes";
import { MiddlewareOptionsModel, UnsetType } from "./models";
import { uuid } from "./util";
import { MemoryStore } from "./stores/memory.store";

export function expressTsSession(opts: Partial<MiddlewareOptionsModel>) {
  if (opts.secret && !Array.isArray(opts.secret)) opts.secret = [opts.secret];

  return function (req: Request, res: Response, next: NextFunction) {
    console.log("init: ", req, res);
    next();
  };
}

export class ExpressTSSession implements MiddlewareOptionsModel {
  cookie?: Cookie;
  genid?: (req: Request) => string | Promise<string>;
  name?: string;
  proxy?: boolean;
  resave?: boolean;
  rolling?: boolean;
  saveUninitialized?: boolean;
  secret: string | string[];
  store?: Store;
  unset?: UnsetType;

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
  public init = (req: Request, res: Response, next: NextFunction) => {
    console.log("init: ", this.name);
    next();
  };
}
