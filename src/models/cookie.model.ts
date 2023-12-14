export type SameSiteType = boolean | "lax" | "strict" | "none";
export type SecureType = boolean | "auto";

export interface CookieDataModel {
  originalMaxAge?: number | null;
  maxAge?: number | null;
  signed?: boolean;
  expires?: Date | null;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: SecureType;
  sameSite?: SameSiteType;
  partitioned?: boolean;
  priority?: boolean | string;
}

export interface CookieModel extends CookieDataModel {
  encode?: (val: string) => string;
  decode?: (val: string) => string;
}
