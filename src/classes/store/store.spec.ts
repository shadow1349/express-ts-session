import { Store } from "./store";

describe("Store Class", () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  it("should be defined", () => {
    expect(store).toBeDefined();
  });
});
