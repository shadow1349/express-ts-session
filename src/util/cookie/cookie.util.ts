import { CookieModel } from "../../models";
import * as crypto from "crypto";

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */
// eslint-disable-next-line no-control-regex
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */
export function parse(str: string, options?: CookieModel) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }

  const obj: { [key: string]: string } = {};
  const dec = decode;

  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);

    // no more cookie pairs
    if (eqIdx === -1) {
      break;
    }

    let endIdx = str.indexOf(";", index);

    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      // backtrack on prior semicolon
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }

    const key = str.slice(index, eqIdx).trim();

    // only assign once
    if (undefined === obj[key]) {
      let val = str.slice(eqIdx + 1, endIdx).trim();

      // quoted values
      if (val.charCodeAt(0) === 0x22) {
        val = val.slice(1, -1);
      }

      obj[key] = tryDecode(val, dec);
    }

    index = endIdx + 1;
  }

  return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */
export function serialize(name: string, val: string, options: CookieModel) {
  const opt = options || {};
  const enc = encode;

  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }

  const value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError("argument val is invalid");
  }

  let str = name + "=" + value;

  if (null != opt.maxAge) {
    const maxAge = opt.maxAge - 0;

    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }

    str += "; Max-Age=" + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }

    str += "; Domain=" + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }

    str += "; Path=" + opt.path;
  }

  if (opt.expires) {
    const expires = opt.expires;

    if (!isDate(expires) || isNaN(expires.valueOf())) {
      throw new TypeError("option expires is invalid");
    }

    str += "; Expires=" + expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += "; HttpOnly";
  }

  if (opt.secure) {
    str += "; Secure";
  }

  // if (opt.partitioned) {
  //   str += "; Partitioned";
  // }

  // if (opt.priority) {
  //   const priority =
  //     typeof opt.priority === "string"
  //       ? opt.priority.toLowerCase()
  //       : opt.priority;

  //   switch (priority) {
  //     case "low":
  //       str += "; Priority=Low";
  //       break;
  //     case "medium":
  //       str += "; Priority=Medium";
  //       break;
  //     case "high":
  //       str += "; Priority=High";
  //       break;
  //     default:
  //       throw new TypeError("option priority is invalid");
  //   }
  // }

  if (opt.sameSite) {
    const sameSite =
      typeof opt.sameSite === "string"
        ? opt.sameSite.toLowerCase()
        : opt.sameSite;

    switch (sameSite) {
      case true:
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError("option sameSite is invalid");
    }
  }

  return str;
}

/**
 * Sign the given `val` with `secret`.
 *
 * @param {String} val
 * @param {String|NodeJS.ArrayBufferView|crypto.KeyObject} secret
 * @return {String}
 */
export const sign = (
  val: string,
  secret: string | NodeJS.ArrayBufferView | crypto.KeyObject | null
): string => {
  if ("string" != typeof val)
    throw new TypeError("Cookie value must be provided as a string.");
  if (null == secret) throw new TypeError("Secret key must be provided.");

  return (
    val +
    "." +
    crypto
      .createHmac("sha256", secret)
      .update(val)
      .digest("base64")
      // eslint-disable-next-line no-useless-escape
      .replace(/\=+$/, "")
  );
};

/**
 * Unsign and decode the given `input` with `secret`,
 * returning `false` if the signature is invalid.
 *
 * @param {String} input
 * @param {String|NodeJS.ArrayBufferView|crypto.KeyObject} secret
 * @return {String|Boolean}
 */
export const unsign = (
  input: string,
  secret: string | NodeJS.ArrayBufferView | crypto.KeyObject | null
): string | boolean => {
  if ("string" != typeof input)
    throw new TypeError("Signed cookie string must be provided.");
  if (null == secret) throw new TypeError("Secret key must be provided.");
  const tentativeValue = input.slice(0, input.lastIndexOf(".")),
    expectedInput = sign(tentativeValue, secret),
    expectedBuffer = Buffer.from(expectedInput),
    inputBuffer = Buffer.from(input);

  return expectedBuffer.length === inputBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, inputBuffer)
    ? tentativeValue
    : false;
};

/**
 * URL-decode string value. Optimized to skip native call when no %.
 *
 * @param {string} str
 * @returns {string}
 */
function decode(str: string) {
  return str.indexOf("%") !== -1 ? decodeURIComponent(str) : str;
}

/**
 * URL-encode value.
 *
 * @param {string} val
 * @returns {string}
 */
function encode(val: string) {
  return encodeURIComponent(val);
}

/**
 * Determine if value is a Date.
 *
 * @param {*} val
 * @private
 */
function isDate(val: Date) {
  return toString.call(val) === "[object Date]" || val instanceof Date;
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */
function tryDecode(str: string, decode: (val: string) => string) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}
