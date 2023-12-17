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

  it("should log a message when destroy is called", () => {
    console.log = jest.fn();
    store.destroy("test-id");
    expect(console.log).toHaveBeenCalledWith(
      "This is a placeholder method. Please make sure you implement a destroy method in your store",
      "test-id"
    );
  });

  it("should log a message and return an empty object when get is called", () => {
    console.log = jest.fn();
    const result = store.get("test-id");
    expect(console.log).toHaveBeenCalledWith(
      "This is a placeholder method. Please make sure you implement a get method in your store",
      "test-id"
    );
    expect(result).toEqual({});
  });
});
