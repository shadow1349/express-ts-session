export type SameSiteType = boolean | "lax" | "strict" | "none";
export type SecureType = boolean | "auto";

export interface CookieOptionsModel {
  originalMaxAge?: number | null;
  maxAge?: number;
  signed?: boolean;
  expires?: Date | null;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: SecureType;
  encode?: (val: string) => string;
  sameSite?: SameSiteType;
}
