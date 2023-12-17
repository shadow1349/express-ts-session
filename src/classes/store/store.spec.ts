import { Request } from "express";
import { Store } from "./store";

describe("Store Class", () => {
  let store: Store;
  let req: Partial<Request>;

  beforeEach(() => {
    req = {};
    store = new Store((req) => "test-id", {});
  });

  it("should be defined", () => {
    expect(store).toBeDefined();
  });

  it("should set genid function", () => {
    expect(store["genid"]).toBeDefined();
  });

  it("req.sessionId should be test-id", async () => {
    await store.generate(req as Request);

    expect(req.sessionId).toBe("test-id");
  });

  it("should set cookieOptions", () => {
    const cookieOptions = { maxAge: 3600 };
    store = new Store((req) => "test-id", cookieOptions);
    expect(store["cookieOptions"]).toBe(cookieOptions);
  });

  it("should set cookieOptions to empty object", () => {
    store = new Store((req) => "test-id");
    expect(store["cookieOptions"]).toEqual({});
  });

  it("should call generate", () => {
    store = new Store((req) => "test-id");

    jest.spyOn(store, "generate");

    store.regenerate(req as Request);
    expect(store.generate).toHaveBeenCalled();
  });

  it("should call destroy", () => {
    store = new Store((req) => "test-id");

    jest.spyOn(store, "destroy");

    store.regenerate(req as Request);
    expect(store.destroy).toHaveBeenCalled();
  });

  it("should call genid when generate is called", () => {
    const genid = jest.fn((req) => "test-id");

    store = new Store(genid);

    store.generate(req as Request);

    expect(genid).toHaveBeenCalled();
  });

  it("should call destroy when regenerate is called", () => {
    store = new Store();

    jest.spyOn(store, "destroy");

    store.regenerate(req as Request);

    expect(store.destroy).toHaveBeenCalled();
  });

  it("should call destroy when destroy is a promise", () => {
    const destroy = jest.fn((sid) => Promise.resolve());

    store = new Store();

    store.destroy = destroy;

    store.destroy("test-id");

    expect(store.destroy).toHaveBeenCalled();
  });

  it("should call genid when regenerate is called", () => {
    const genid = jest.fn((req) => "test-id");

    store = new Store(genid);

    store.regenerate(req as Request);

    expect(genid).toHaveBeenCalled();
  });

  it("should generate session id from promise", async () => {
    const genid = jest.fn((req) => Promise.resolve("test-id"));

    store = new Store(genid);

    await store.generate(req as Request);

    expect(req.sessionId).toBe("test-id");
  });

  it("should load session", () => {
    const get = jest.fn((sid) => ({ sid }));

    store = new Store();
    store.get = get;

    store.load("test-id");

    expect(store.get).toHaveBeenCalled();
  });

  it("should throw error on load", () => {
    store = new Store();

    expect(async () => store.load("test-id")).rejects.toThrow();
  });

  it("should throw error on load for promise", () => {
    const get = jest.fn((sid) => Promise.reject());

    store = new Store();
    store.get = get;

    expect(async () => store.load("test-id")).rejects.toThrow();
  });
});
