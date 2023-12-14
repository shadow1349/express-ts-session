import { Request } from "express";
import { CookieModel, SessionModel, StoreModel } from "../models";
import { uuid } from "../util";
import { Session } from "./session";
import { Cookie } from "./cookie";

export class Store implements Partial<StoreModel> {
  constructor(
    private genid?: (req: Request) => string | Promise<string>,
    private cookieOptions: Partial<CookieModel> = {}
  ) {}

  /**
   * PLACEHOLDER METHOD
   * This method is a placeholder method so that TypeScript doesn't complain
   * about calling destroy from other functions
   */
  destroy(sid: string): void | Promise<void> {
    console.log(
      "This is a placeholder method. Please make sure you implement a destroy method in your store",
      sid
    );
  }
  /**
   * PLACEHOLDER METHOD
   * This method is a placeholder method so that TypeScript doesn't complain
   * about calling destroy from other functions
   */
  get(sid: string): SessionModel | Promise<SessionModel> {
    console.log(
      "This is a placeholder method. Please make sure you implement a get method in your store",
      sid
    );

    return new Session({} as Request);
  }

  async generate(req: Request): Promise<void> {
    const newSessionId = this.genid ? this.genid(req) : uuid();

    if (newSessionId instanceof Promise) {
      await newSessionId.then((sid) => {
        req.sessionId = sid;
      });
    } else {
      req.sessionId = newSessionId;
    }

    req.session = new Session(req);
    req.session.cookie = new Cookie(this.cookieOptions || {});

    // if (this.cookieOptions.secure === "auto") {
    //   req.session.cookie.secure = issecure(req, trustProxy);
    // }
  }

  async regenerate(req: Request) {
    const destroyResult = this.destroy(req.sessionId);

    if (destroyResult instanceof Promise) await destroyResult;

    const generateResult = this.generate(req);

    if (generateResult instanceof Promise) await generateResult;
  }

  async load(sid: string) {
    console.log(
      "This is a placeholder method. Please make sure you implement a load method in your store",
      sid
    );

    let existingSession = this.get(sid);

    if (existingSession instanceof Promise)
      existingSession = await existingSession.catch((err) => {
        throw new Error(err);
      });

    if (existingSession) {
      this.createSession({} as Request, existingSession);
    } else
      throw new Error(
        `Session with ID ${sid} not found, could not load session`
      );
  }
  createSession(req: Request, session: SessionModel) {
    console.log("CREATE SESSION: ", req, session);
    return session;
  }
}
