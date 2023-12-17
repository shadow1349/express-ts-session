import { Cookie } from "./cookie";

describe("Cookie Class", () => {
  let cookie: Cookie;

  beforeEach(() => {
    cookie = new Cookie({
      maxAge: 3600,
      signed: true,
      expires: null,
      httpOnly: true,
      path: "/",
      domain: "example.com",
      secure: false,
      encode: encodeURIComponent,
      sameSite: false,
    });
  });

  it("should be defined", () => {
    expect(cookie).toBeDefined();
  });

  it("should set maxAge", () => {
    expect(cookie.maxAge).toBe(3600);
  });

  it("should set signed", () => {
    expect(cookie.signed).toBe(true);
  });

  it("should set expires", () => {
    expect(cookie.expires).toBeNull();
  });

  it("should set httpOnly", () => {
    expect(cookie.httpOnly).toBe(true);
  });

  it("should set path", () => {
    expect(cookie.path).toBe("/");
  });

  it("should set domain", () => {
    expect(cookie.domain).toBe("example.com");
  });

  it("should set secure", () => {
    expect(cookie.secure).toBe(false);
  });

  it("should set encode", () => {
    expect(cookie.encode).toBe(encodeURIComponent);
  });

  it("should set sameSite", () => {
    expect(cookie.sameSite).toBe(false);
  });

  it("should set expiry date", () => {
    const date = new Date();
    cookie.expiry = date;
    expect(cookie.expires).toBe(date);
  });

  it("should set maxage", () => {
    const milliseconds = 5000;
    cookie.maxage = milliseconds;
    expect(cookie.expires).toBeInstanceOf(Date);
    expect(cookie.originalMaxAge).toBe(3600);
  });
});
