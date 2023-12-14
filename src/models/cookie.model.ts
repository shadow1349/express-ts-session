export type SameSiteType = boolean | "lax" | "strict" | "none";
export type SecureType = boolean | "auto";

export interface CookieModel {
  originalMaxAge?: number | null;
  maxAge?: number | null;
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
}
