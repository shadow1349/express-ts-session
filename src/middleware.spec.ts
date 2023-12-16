import { Cookie } from "./classes";
import { ExpressTSSession } from "./middleware";

describe("Session Class", () => {
  let middleware: ExpressTSSession;

  beforeEach(() => {
    middleware = new ExpressTSSession({
      secret: "test",
      cookie: new Cookie({
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: false,
        httpOnly: true,
        path: "/",
        sameSite: false,
        signed: true,
      }),
      name: "test",
    });
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });
});
