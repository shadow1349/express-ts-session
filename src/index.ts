// import { Request } from "express";
import { NextFunction, Request, Response } from "express";
import { SessionDataModel, SessionModel, SessionOptionsModel } from "./models";
import { uuid } from "./util";
import { DefaultStore } from "./store";
import * as crypto from "crypto";
import * as signature from "cookie-signature";
import * as cookie from "cookie";
import onHeaders from "on-headers";

export * from "./models";

export class Session implements SessionModel {
  options: SessionOptionsModel;
  private ready: boolean = false;
  private originalHash?: string;
  private originalId?: string;
  private savedHash?: string;
  private cookieId?: string;

  constructor(private opts: Partial<SessionOptionsModel>) {
    this.options = {
      cookie: this.opts.cookie || {},
      genid: this.opts.genid || this.generateSessionId,
      name: this.opts.name || "express-ts-session",
      proxy: this.opts.proxy || false,
      resave: this.opts.resave || true,
      rolling: this.opts.rolling || false,
      saveUninitialized: this.opts.saveUninitialized || true,
      secret: this.opts.secret || "express-ts-session",
      store: this.opts.store || new DefaultStore(),
      unset: this.opts.unset || "keep",
    };

    if (this.opts.secret && !Array.isArray(this.opts.secret))
      this.options.secret = [this.opts.secret];

    if (!this.options.store.generate)
      this.options.store.generate = this.generateSessionId;
  }

  generateSessionId() {
    // this.options.store.generate();
    return uuid();
  }

  session(req: Request, res: Response, next: NextFunction) {
    if (req.session) {
      next();
      return;
    }

    if (!this.ready) {
      next();
      console.error("The store is not ready yet.");
      return;
    }

    let touched = false;
    onHeaders(res, () => {
      if (!req.session) {
        console.debug("no session found");
        return;
      }

      this.cookieId = req.sessionId = this.getcookie(req) as string;

      if (!this.shouldSetCookie(req)) {
        return;
      }

      if (req.session.cookie.secure && !this.issecure(req)) {
        console.debug("not secured");
        return;
      }

      if (!touched) {
        req.session.touch();
        touched = true;
      }

      this.setcookie(res, req.sessionId, req.session.cookie);
    });

    return;
  }

  private hash(session: SessionDataModel) {
    const sessionString = JSON.stringify(session, (key, val) => {
      if (key !== "cookie") {
        return val;
      }
    });

    return crypto.createHash("sha256").update(sessionString).digest("hex");
  }

  private issecure(req: Request) {
    // socket is https server
    // if (req.socket && req.socket.encrypted) {
    //   return true;
    // }

    // do not trust proxy
    if (this.options.proxy === false) return false;

    // no explicit trust; try req.secure from express
    if (this.options.proxy !== true) return req.secure === true;

    // read the proto from x-forwarded-proto header
    const header = (req.headers["x-forwarded-proto"] as string) || "";
    const index = header.indexOf(",");
    const proto =
      index !== -1
        ? header.substring(0, index).toLowerCase().trim()
        : header.toLowerCase().trim();

    return proto === "https";
  }

  private getcookie(req: Request) {
    const header = req.headers.cookie;
    let raw: string, val: string | boolean | undefined;

    // read from cookie header
    if (header) {
      const cookies = cookie.parse(header);

      raw = cookies[this.options.name];

      if (raw) {
        if (raw.substring(0, 2) === "s:") {
          val = this.unsigncookie(raw.slice(2));

          if (val === false) {
            console.debug("cookie signature invalid");
            val = undefined;
          }
        } else {
          console.debug("cookie unsigned");
        }
      }
    }

    // back-compat read from cookieParser() signedCookies data
    if (!val && req.signedCookies) {
      val = req.signedCookies[this.options.name];

      if (val) {
        console.error("cookie should be available in req.headers.cookie");
      }
    }

    // back-compat read from cookieParser() cookies data
    if (!val && req.cookies) {
      raw = req.cookies[this.options.name];

      if (raw) {
        if (raw.substring(0, 2) === "s:") {
          val = this.unsigncookie(raw.slice(2));

          if (val) {
            console.error("cookie should be available in req.headers.cookie");
          }

          if (val === false) {
            console.debug("cookie signature invalid");
            val = undefined;
          }
        } else {
          console.debug("cookie unsigned");
        }
      }
    }

    return val;
  }

  private unsigncookie(val: string) {
    let secrets = this.options.secret;

    if (!Array.isArray(secrets)) {
      secrets = [secrets];
    }

    for (let i = 0; i < secrets.length; i++) {
      const result = signature.unsign(val, secrets[i]);

      if (result !== false) {
        return result;
      }
    }

    return false;
  }

  private setcookie(res: Response, val: string, options: any) {
    const signed = "s:" + signature.sign(val, this.options.secret[0]);
    const data = cookie.serialize(this.options.name, signed, options);

    console.debug("set-cookie %s", data);

    const prev = (res.getHeader("Set-Cookie") as string[]) || [];
    const header = Array.isArray(prev) ? prev.concat(data) : [prev, data];

    res.setHeader("Set-Cookie", header);
  }

  private shouldSetCookie(req: Request) {
    // cannot set cookie without a session ID
    if (typeof req.sessionId !== "string") {
      return false;
    }

    return this.cookieId !== req.sessionId
      ? this.options.saveUninitialized || this.isModified(req.session)
      : this.options.rolling ||
          (req.session.cookie.expires != null && this.isModified(req.session));
  }

  private isModified(session: SessionDataModel) {
    return (
      this.originalId !== session.id || this.originalHash !== this.hash(session)
    );
  }

  private shouldSave(req: Request) {
    // cannot set cookie without a session ID
    if (typeof req.sessionId !== "string") {
      console.debug(
        "session ignored because of bogus req.sessionID %o",
        req.sessionId
      );
      return false;
    }

    return !this.options.saveUninitialized &&
      !this.savedHash &&
      "cookieId" !== req.sessionId
      ? this.isModified(req.session)
      : !this.isSaved(req.session);
  }

  private isSaved(session: SessionDataModel) {
    return (
      this.originalId === session.id && this.savedHash === this.hash(session)
    );
  }

  private shouldTouch(req: Request) {
    // cannot set cookie without a session ID
    if (typeof req.sessionId !== "string") {
      console.debug(
        "session ignored because of bogus req.sessionID %o",
        req.sessionId
      );
      return false;
    }

    return this.cookieId === req.sessionId && !this.shouldSave(req);
  }
}
