import { Request } from "express";
import { Session } from "./session";
import { MemoryStore } from "../stores/memory/memory.store";

describe("Session Class", () => {
  let session: Session;
  let req: Partial<Request>;

  beforeEach(() => {
    req = {
      sessionId: "test-id",
      sessionStore: new MemoryStore(),
      genid: () => "test-id",
    };

    session = new Session(req as Request);
  });

  it("should be defined", () => {
    expect(session).toBeDefined();
  });

  it("should set id from request sessionId", () => {
    expect(session.id).toBe("test-id");
  });

  it("should throw error if there is no session id", () => {
    req = {
      sessionStore: new MemoryStore(),
      genid: () => "test-id",
    };
    expect(() => new Session(req as Request)).toThrow();
  });

  it("should throw error if there is no session store", () => {
    req = {
      sessionId: "test-id",
      genid: () => "test-id",
    };
    expect(() => new Session(req as Request)).toThrow();
  });

  it("should set data on the store", () => {
    session.data = { test: "test" };

    expect(session.data).toEqual({
      id: "test-id",
      cookie: {
        maxAge: 86400000,
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
      },
      test: "test",
    });
  });

  it("should get data from the store", () => {
    expect(session.data).toEqual({
      id: "test-id",
      cookie: {
        maxAge: 86400000,
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
      },
    });
  });

  it("should save session data", () => {
    const spy = jest.spyOn(session["store"], "set");
    session.save();
    expect(spy).toHaveBeenCalled();
  });

  it("should delete session data", () => {
    const spy = jest.spyOn(session["store"], "destroy");
    session.destroy();
    expect(spy).toHaveBeenCalled();
  });

  it("should reload session", async () => {
    await session.save();

    const spy = jest.spyOn(session["store"], "get");

    await session.reload();

    expect(spy).toHaveBeenCalled();
  });

  it("should touch session", () => {
    const spy = jest.spyOn(session, "resetMaxAge");
    session.touch();
    expect(spy).toHaveBeenCalled();
  });
});
// describe("Session Class", () => {

//   it("should set cookie if sessionData has cookie", () => {
//     const cookie = new Cookie({});
//     session = new Session(req as Request, { cookie });
//     expect(session.cookie).toBe(cookie);
//   });

//   it("should create new cookie if sessionData has no cookie", () => {
//     expect(session.cookie).toBeInstanceOf(Cookie);
//   });

//   it("should set sessionStore from request sessionStore", () => {
//     expect(session["sessionStore"]).toBe(req.sessionStore);
//   });

//   it("should create new sessionStore if request has no sessionStore", () => {
//     delete req.sessionStore;
//     session = new Session(req as Request);
//     expect(session["sessionStore"]).toBeInstanceOf(Store);
//   });

//   it("should save session", () => {
//     const spy = jest.spyOn(session["sessionStore"], "set");
//     session.save();
//     expect(spy).toHaveBeenCalled();
//   });

//   it("should reload session", () => {
//     session.id = "new-id";

//     session["sessionStore"].set("new-id", { test: "new-test" });

//     const spy = jest.spyOn(session["sessionStore"], "get");
//     session.reload();
//     expect(spy).toHaveBeenCalled();
//   });

//   it("should regenerate session", () => {
//     const spy = jest.spyOn(session["sessionStore"], "regenerate");
//     session.regenerate();
//     expect(spy).toHaveBeenCalled();
//   });

//   it("should set properties from sessionData", () => {
//     session = new Session(req as Request, { prop: "value" });
//     expect(session["prop"]).toBe("value");
//   });
// });
