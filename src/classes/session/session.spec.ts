import { Request } from "express";
import { Session } from "./session";
import { MemoryStore } from "../../stores/memory/memory.store";
import { Cookie, Store } from "..";

describe("Session Class", () => {
  let session: Session;
  let req: Partial<Request>;

  beforeEach(() => {
    req = {
      sessionId: "test-id",
      sessionStore: new MemoryStore(() => "test-uuid"),
    };
    session = new Session(req as Request);
  });

  it("should be defined", () => {
    expect(session).toBeDefined();
  });

  it("should set id from request sessionId", () => {
    expect(session.id).toBe("test-id");
  });

  it("should set cookie if sessionData has cookie", () => {
    const cookie = new Cookie({});
    session = new Session(req as Request, { cookie });
    expect(session.cookie).toBe(cookie);
  });

  it("should create new cookie if sessionData has no cookie", () => {
    expect(session.cookie).toBeInstanceOf(Cookie);
  });

  it("should set sessionStore from request sessionStore", () => {
    expect(session["sessionStore"]).toBe(req.sessionStore);
  });

  it("should create new sessionStore if request has no sessionStore", () => {
    delete req.sessionStore;
    session = new Session(req as Request);
    expect(session["sessionStore"]).toBeInstanceOf(Store);
  });

  it("should set properties from sessionData", () => {
    session = new Session(req as Request, { prop: "value" });
    expect(session["prop"]).toBe("value");
  });
});
