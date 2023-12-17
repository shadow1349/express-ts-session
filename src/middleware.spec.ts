import * as bodyParser from "body-parser";
import express, { Request, Response } from "express";
import request from "supertest";
import { Cookie, Store } from "./classes";
import { ExpressTSSession } from "./middleware";
import { MemoryStore } from "./stores/memory/memory.store";

describe("ExpressTSSession", () => {
  const store = new MemoryStore();
  const middleware = new ExpressTSSession({
    secret: "test",
    cookie: new Cookie({
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: false,
      httpOnly: true,
      path: "/",
      sameSite: false,
      signed: true,
    }),
    name: "test",
    store,
  });
  let req: Partial<Request>;
  let res: Partial<Response>;

  const app = express();
  app.use(bodyParser.json());
  app.use(middleware.init);

  // Set the request object to the app so we can access it in our tests
  app.use((request, response, next) => {
    req = request;
    res = response;
    next();
  });

  app.get("/", (req, res) => {
    res.status(200).json({ message: "ok" });
  });

  app.post("/set", (req, res) => {
    const { key, value } = req.body;

    if (!value || !value)
      return res
        .status(400)
        .json({ message: "both key and value is required" });

    req.session[key] = value;
    res.status(200).json({ message: "ok" });
  });

  app.delete("/destroy", (req, res) => {
    req.session.destroy();
    res.status(200).json({ message: "ok" });
  });

  beforeEach(() => {
    req = { headers: {} };
    res = {};
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });

  it("should throw error if no secret is provided", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => new ExpressTSSession({})).toThrow();
  });

  it("should throw error if empty array is provided for secret", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => new ExpressTSSession({ secret: [] })).toThrow();
  });

  it("should set cookie", async () => {
    const response = await request(app).get("/");

    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should call store.generate", async () => {
    jest.spyOn(store, "generate");

    await request(app).get("/");

    expect(store.generate).toHaveBeenCalled();
  });

  it("should have session", async () => {
    await request(app).get("/");

    expect(req.session).toBeDefined();
  });

  it("should call store.set", async () => {
    jest.spyOn(store, "set");

    const response = await request(app)
      .post("/set")
      .send({ value: "test", key: "test" });

    expect(response.status).toBe(200);

    expect(store.set).toHaveBeenCalled();
  });

  it("should call store.get", async () => {
    jest.spyOn(store, "get");

    const response = await request(app).get("/");
    const cookie = response.headers["set-cookie"];

    expect(cookie).toBeDefined();

    await request(app).get("/").set("Cookie", cookie);

    expect(store.get).toHaveBeenCalled();
  });

  it("should call store.destroy", async () => {
    jest.spyOn(store, "destroy");

    const response = await request(app).delete("/destroy");

    expect(response.status).toBe(200);
    expect(store.destroy).toHaveBeenCalled();
  });

  it("should set session value", async () => {
    const response = await request(app)
      .post("/set")
      .send({ key: "test", value: "test" });

    expect(response.status).toBe(200);
    expect(req.session!.test).toBe("test");
  });

  it("should generate id", async () => {
    middleware.genid = jest.fn().mockResolvedValue("test-id");

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
