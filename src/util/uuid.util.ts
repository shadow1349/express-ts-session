/* eslint-disable no-bitwise */

// lookup table byte to hex
const byte2hex: string[] = [...new Array(256)].map((_, index) =>
  (index + 0x100).toString(16).substr(1)
);

/** v4 fast. Shaken out of https://github.com/scravy/uuid-1345/blob/master/index.js */
export const uuid = (): string => {
  const r1 = Math.random() * 0x100000000;
  const r2 = Math.random() * 0x100000000;
  const r3 = Math.random() * 0x100000000;
  const r4 = Math.random() * 0x100000000;

  return (
    byte2hex[r1 & 0xff] +
    byte2hex[(r1 >>> 8) & 0xff] +
    byte2hex[(r1 >>> 16) & 0xff] +
    byte2hex[(r1 >>> 24) & 0xff] +
    "-" +
    byte2hex[r2 & 0xff] +
    byte2hex[(r2 >>> 8) & 0xff] +
    "-" +
    byte2hex[((r2 >>> 16) & 0x0f) | 0x40] +
    byte2hex[(r2 >>> 24) & 0xff] +
    "-" +
    byte2hex[(r3 & 0x3f) | 0x80] +
    byte2hex[(r3 >>> 8) & 0xff] +
    "-" +
    byte2hex[(r3 >>> 16) & 0xff] +
    byte2hex[(r3 >>> 24) & 0xff] +
    byte2hex[r4 & 0xff] +
    byte2hex[(r4 >>> 8) & 0xff] +
    byte2hex[(r4 >>> 16) & 0xff] +
    byte2hex[(r1 >>> 24) & 0xff]
  );
};
