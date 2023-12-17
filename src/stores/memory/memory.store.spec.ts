import { SessionDataModel } from "../../models";
import { MemoryStore } from "./memory.store";

describe("Memory Store", () => {
  let store: MemoryStore;
  let sessionData: SessionDataModel;

  beforeEach(() => {
    store = new MemoryStore();
    sessionData = { cookie: { maxAge: 3600 } };
    store.set("test-id", sessionData);
  });

  it("should be defined", () => {
    expect(store).toBeDefined();
  });

  it("should get session data", () => {
    expect(store.get("test-id")).toBe(sessionData);
  });

  it("should throw error if session does not exist", () => {
    expect(() => store.get("non-existent-id")).toThrow();
  });

  it("should set session data", () => {
    const newSessionData = { cookie: { maxAge: 7200 } };
    store.set("new-id", newSessionData);
    expect(store.get("new-id")).toBe(newSessionData);
  });

  it("should destroy session", () => {
    store.set("test-id", { id: "123" });
    store.destroy("test-id");
    expect(() => store.get("test-id")).toThrow();
  });

  it("should return length of sessions", () => {
    expect(store.length()).toBe(1);
  });

  it("should return all sessions", () => {
    expect(store.all()).toEqual([sessionData]);
  });

  it("should touch session", () => {
    const newCookie = { maxAge: 7200 };
    store.touch("test-id", { cookie: newCookie });
    expect(store.get("test-id").cookie).toBe(newCookie);
  });

  it("should clear all sessions", () => {
    store.clear();
    expect(store.length()).toBe(0);
  });
});
