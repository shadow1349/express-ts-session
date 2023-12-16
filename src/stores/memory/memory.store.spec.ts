import { MemoryStore } from "./memory.store";

describe("Memory Store", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it("should be defined", () => {
    expect(store).toBeDefined();
  });
});
