import { uuid } from "./uuid.util";

describe("uuid", () => {
  it("should generate a valid UUID", () => {
    const result = uuid();
    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("should generate unique UUIDs", () => {
    const results = new Set();
    for (let i = 0; i < 10000; i++) {
      results.add(uuid());
    }
    expect(results.size).toBe(10000);
  });
});
