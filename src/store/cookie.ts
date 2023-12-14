import { CookieModel, SameSiteType, SecureType } from "../models";
import { serialize } from "../util";

export class Cookie implements CookieModel {
  originalMaxAge?: number | null;
  maxAge?: number;
  signed?: boolean;
  expires?: Date | null;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: SecureType;
  encode?: (val: string) => string;
  decode?: (val: string) => string;
  sameSite?: SameSiteType;
  partitioned?: boolean;
  priority?: boolean | string;

  constructor(private opts: Partial<CookieModel>) {
    this.maxAge = opts.maxAge || undefined;
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

  set maxage(milliseconds: number) {
    this.expires = new Date(Date.now() + milliseconds);
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
    return serialize(name, val, this.data);
  }
}
