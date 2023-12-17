import { Request } from "express";
import { Store } from "./store";

describe("Store Class", () => {
  let store: Store;
  let req: Partial<Request>;
  const genid = jest.fn((req) => "test-id");

  beforeEach(() => {
    req = { genid };
    store = new Store({});
  });

  it("should be defined", () => {
    expect(store).toBeDefined();
  });

  it("req.sessionId should be test-id", async () => {
    await store.generate(req as Request);

    expect(req.sessionId).toBe("test-id");
  });

  it("should set cookieOptions", () => {
    const cookieOptions = { maxAge: 3600 };
    const store = new Store(cookieOptions);
    expect(store["cookieOptions"]).toBe(cookieOptions);
  });

  it("should set cookieOptions to empty object", () => {
    expect(store["cookieOptions"]).toEqual({});
  });

  it("should call generate", () => {
    jest.spyOn(store, "generate");

    store.regenerate(req as Request);
    expect(store.generate).toHaveBeenCalled();
  });

  it("should call destroy", () => {
    jest.spyOn(store, "destroy");

    store.regenerate(req as Request);
    expect(store.destroy).toHaveBeenCalled();
  });

  it("should call genid when generate is called", () => {
    const genidSpy = jest.spyOn(req, "genid");
    store = new Store();

    store.generate(req as Request);

    expect(genidSpy).toHaveBeenCalled();
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
    store = new Store();

    store.regenerate(req as Request);

    expect(genid).toHaveBeenCalled();
  });

  it("should generate session id from promise", async () => {
    store = new Store();

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
