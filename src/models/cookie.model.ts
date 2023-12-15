export type SameSiteType = boolean | "lax" | "strict" | "none";
export type SecureType = boolean | "auto";

export interface CookieDataModel {
  /**
   * Returns the original `maxAge` (time-to-live), in milliseconds, of the session cookie.
   */
  originalMaxAge?: number | null;
  /**
   * Indicates the number of seconds until the cookie expires. A zero or negative number will
   * expire the cookie immediately. If both Expires and Max-Age are set, Max-Age has precedence.
   *
   * @default 9000
   */
  maxAge?: number | null;
  signed?: boolean;
  /**
   * Indicates the maximum lifetime of the cookie as an HTTP-date timestamp. See Date for the required formatting.
   * If unspecified, the cookie becomes a session cookie. A session finishes when the client shuts down, after which the session cookie is removed.
   * When an Expires date is set, the deadline is relative to the client the cookie is being set on, not the server.
   *
   * WARNING: Many web browsers have a session restore feature that will save all tabs and restore them the next time the browser is used.
   * Session cookies will also be restored, as if the browser was never closed.
   */
  expires?: Date | null;
  /**
   * Specifies the boolean value for the `HttpOnly Set-Cookie` attribute. When truthy, the `HttpOnly` attribute is set, otherwise it is not.
   * By default, the `HttpOnly` attribute is set.
   *
   * Be careful when setting this to `true`, as compliant clients will not allow client-side JavaScript to see the cookie in `document.cookie`.
   */
  httpOnly?: boolean;
  /**
   * Specifies the value for the `Path Set-Cookie` attribute.
   * By default, this is set to '/', which is the root path of the domain.
   */
  path?: string;
  /**
   * Specifies the value for the `Domain Set-Cookie` attribute.
   * By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.
   */
  domain?: string;
  /**
   * Specifies the boolean value for the `Secure Set-Cookie` attribute. When truthy, the `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.
   * Be careful when setting this to true, as compliant clients will not send the cookie back to the server in the future if the browser does not have an HTTPS connection.
   *
   * Please note that `secure: true` is a **recommended option**.
   * However, it requires an https-enabled website, i.e., HTTPS is necessary for secure cookies.
   * If `secure` is set, and you access your site over HTTP, **the cookie will not be set**.
   *
   * The cookie.secure option can also be set to the special value `auto` to have this setting automatically match the determined security of the connection.
   * Be careful when using this setting if the site is available both as HTTP and HTTPS, as once the cookie is set on HTTPS, it will no longer be visible over HTTP.
   * This is useful when the Express "trust proxy" setting is properly setup to simplify development vs production configuration.
   *
   * If you have your node.js behind a proxy and are using `secure: true`, you need to set "trust proxy" in express. Please see the [README](https://github.com/expressjs/session) for details.
   *
   * Please see the [README](https://github.com/expressjs/session) for an example of using secure cookies in production, but allowing for testing in development based on NODE_ENV.
   */
  secure?: SecureType;
  /**
   * Specifies the boolean or string to be the value for the `SameSite Set-Cookie` attribute.
   * - `true` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
   * - `false` will not set the `SameSite` attribute.
   * - `lax` will set the `SameSite` attribute to `Lax` for lax same site enforcement.
   * - `none` will set the `SameSite` attribute to `None` for an explicit cross-site cookie.
   * - `strict` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
   *
   * More information about the different enforcement levels can be found in the specification.
   *
   * **Note:** This is an attribute that has not yet been fully standardized, and may change in the future.
   * This also means many clients may ignore this attribute until they understand it.
   */
  sameSite?: SameSiteType;
  partitioned?: boolean;
  priority?: boolean | string;
}

export interface CookieModel extends CookieDataModel {
  encode?: (val: string) => string;
  decode?: (val: string) => string;
}
