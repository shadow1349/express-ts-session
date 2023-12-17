import { CookieModel } from "../../models";
import { parse, serialize, sign, unsign } from "./cookie.util";

describe("Cookie Util", () => {
  describe("parse", () => {
    it("should parse cookie string into an object", () => {
      const str = "name=value; name2=value2";
      const result = parse(str);
      expect(result).toEqual({ name: "value", name2: "value2" });
    });
  });

  describe("serialize", () => {
    it("should serialize cookie name and value into a string", () => {
      const name = "name";
      const val = "value";
      const result = serialize(name, val, {});
      expect(result).toBe("name=value");
    });

    it("should serialize cookie with secure option", () => {
      const result = serialize("name", "value", { secure: true });
      expect(result).toBe("name=value; Secure");
    });

    it("should serialize cookie with httpOnly option", () => {
      const result = serialize("name", "value", { httpOnly: true });
      expect(result).toBe("name=value; HttpOnly");
    });

    it("should serialize cookie with domain option", () => {
      const result = serialize("name", "value", { domain: "example.com" });
      expect(result).toBe("name=value; Domain=example.com");
    });

    it("should serialize cookie with path option", () => {
      const result = serialize("name", "value", { path: "/path" });
      expect(result).toBe("name=value; Path=/path");
    });

    it("should serialize cookie with maxAge option", () => {
      const result = serialize("name", "value", { maxAge: 3600 });
      expect(result).toBe("name=value; Max-Age=3600");
    });

    it("should serialize cookie with sameSite option", () => {
      const result = serialize("name", "value", { sameSite: "strict" });
      expect(result).toBe("name=value; SameSite=Strict");
    });

    it("should serialize cookie with multiple options", () => {
      const options = {
        secure: true,
        httpOnly: true,
        domain: "example.com",
        path: "/path",
        maxAge: 3600,
        sameSite: "strict",
      };
      const result = serialize("name", "value", options as CookieModel);
      expect(result).toBe(
        "name=value; Max-Age=3600; Domain=example.com; Path=/path; HttpOnly; Secure; SameSite=Strict"
      );
    });
  });

  describe("sign", () => {
    it("should throw error secret is not a string", () => {
      expect(() => sign("value", 1 as any)).toThrow();
    });

    it("should throw error if there is no secret", () => {
      expect(() => sign("value", null)).toThrow();
    });

    it("should always match with same value and secret", () => {
      const val = "value";
      const secret = "secret";

      const firstResult = sign(val, secret);
      const secondResult = sign(val, secret);

      expect(firstResult).toBe(secondResult);
    });
  });

  describe("unsign", () => {
    let signed: string;
    const val = "someValue";
    const secret = "secret";

    beforeEach(() => {
      signed = sign(val, secret);
    });

    it("should throw error secret is not a string", () => {
      expect(() => unsign(signed, 1 as any)).toThrow();
    });

    it("should throw error if there is no secret", () => {
      expect(() => unsign(signed, null)).toThrow();
    });

    it("should return false if the secret is different", () => {
      const result = unsign(val, "differentSecret");
      expect(result).toBe(false);
    });

    it("should return false if the val is different", () => {
      const result = unsign("differentVal", secret);
      expect(result).toBe(false);
    });

    it("should unsign the cookie value", () => {
      const result = unsign(signed, secret);
      expect(result).toBe(val);
    });
  });
});
