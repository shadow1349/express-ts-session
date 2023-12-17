import { Request, Response } from "express";
import { ExpressTSSession } from "./middleware";
import { SessionDataModel } from "./models";
import { MemoryStore } from "./stores/memory/memory.store";
import { Cookie } from "./classes";

describe("ExpressTSSession", () => {
  let middleware: ExpressTSSession;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let sessionData: SessionDataModel;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    sessionData = { cookie: { maxAge: 3600 } };
    middleware = new ExpressTSSession({
      cookie: new Cookie({ maxAge: 3600 }),
      genid: (req) => "test-id",
      name: "test-name",
      resave: false,
      rolling: false,
      saveUninitialized: false,
      secret: "test-secret",
      store: new MemoryStore(),
      unset: "destroy",
    });
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });

  it("should generate id", async () => {
    const id = await middleware.genid(req as Request);
    expect(id).toBe("test-id");
  });

  it("should init session", () => {
    const next = jest.fn();
    middleware.init(req as Request, res as Response, next);
    expect(req.session).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});
