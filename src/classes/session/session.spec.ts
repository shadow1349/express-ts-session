import { Request } from "express";
import { Session } from "./session";

describe("Session Class", () => {
  let session: Session;

  beforeEach(() => {
    session = new Session({} as Request);
  });

  it("should be defined", () => {
    expect(session).toBeDefined();
  });
});
