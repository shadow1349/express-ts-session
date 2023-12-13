import { CookieOptionsModel } from "../models";
import * as cookie from "cookie";

export class Cookie implements CookieOptionsModel {
  originalMaxAge?: number;
  maxAge?: number;
  signed?: boolean;
  expires?: Date | null;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: boolean | "auto";
  encode?: (val: string) => string;
  sameSite?: boolean | "lax" | "strict" | "none";

  constructor(private opts: Partial<CookieOptionsModel>) {
    this.maxAge = opts.maxAge;
    this.signed = opts.signed || false;
    this.expires = opts.expires || null;
    this.httpOnly = opts.httpOnly || true;
    this.path = opts.path || "/";
    this.domain = opts.domain;
    this.secure = opts.secure || false;
    this.encode = opts.encode || encodeURIComponent;
    this.sameSite = opts.sameSite || false;

    if (!this.originalMaxAge) this.originalMaxAge = this.maxAge;
  }

  set expiry(date: Date) {
    this.expires = date;
    this.originalMaxAge = this.maxAge;
  }

  set maxage(ms: number) {
    this.expires = new Date(Date.now() + ms);
    this.originalMaxAge = this.maxAge;
  }

  get maxage() {
    return this.expires instanceof Date
      ? this.expires.valueOf() - Date.now()
      : 0;
  }

  get data() {
    return {
      maxAge: this.maxage,
      expires: this.expires,
      httpOnly: this.httpOnly,
      path: this.path,
      domain: this.domain,
      secure: this.secure,
      sameSite: this.sameSite,
    };
  }

  serialize(name: string, val: string) {
    return cookie.serialize(
      name,
      val,
      this.data as cookie.CookieSerializeOptions
    );
  }

  toJSON() {
    return this.data;
  }
}
