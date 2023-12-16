import { Cookie } from "./cookie";

describe("Cookie Class", () => {
  let cookie: Cookie;

  beforeEach(() => {
    cookie = new Cookie({});
  });

  it("should be defined", () => {
    expect(cookie).toBeDefined();
  });
});
