import { Request } from "express";
import { CookieModel, SessionDataModel, StoreModel } from "../../models";
import { uuid } from "../../util";
import { Cookie } from "../cookie/cookie";
import { Session } from "../session/session";

export class Store implements StoreModel {
  constructor(
    private genid?: (req: Request) => string | Promise<string>,
    private cookieOptions: Partial<CookieModel> = {}
  ) {}

  //  PLACEHOLDER METHOD
  //  This method is a placeholder method so that TypeScript doesn't complain
  //  about calling destroy from other functions
  destroy(sid: string): void | Promise<void> {
    console.log(
      "This is a placeholder method. Please make sure you implement a destroy method in your store",
      sid
    );
  }

  //  PLACEHOLDER METHOD
  //  This method is a placeholder method so that TypeScript doesn't complain
  //  about calling get from other functions
  get(sid: string): SessionDataModel | Promise<SessionDataModel> {
    console.log(
      "This is a placeholder method. Please make sure you implement a get method in your store",
      sid
    );

    return {};
  }

  //  PLACEHOLDER METHOD
  //  This method is a placeholder method so that TypeScript doesn't complain
  //  about calling set from other functions
  set(sid: string, data: SessionDataModel): void {
    console.log(
      "This is a placeholder method. Please make sure you implement a set method in your store",
      sid,
      data
    );
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
  }

  async regenerate(req: Request) {
    const destroyResult = this.destroy(req.sessionId);

    if (destroyResult instanceof Promise) await destroyResult;

    const generateResult = this.generate(req);

    if (generateResult instanceof Promise) await generateResult;
  }

  async load(sid: string) {
    let existingSession = this.get(sid);

    if (existingSession instanceof Promise)
      existingSession = await existingSession.catch((err) => {
        throw new Error(err);
      });

    if (existingSession && Object.keys(existingSession).length > 0) {
      this.createSession({ sessionId: sid } as Request, existingSession);
    } else
      throw new Error(
        `Session with ID ${sid} not found, could not load session`
      );
  }

  createSession(
    req: Request,
    sessionData?: SessionDataModel,
    setReqSesion = true
  ) {
    const session = new Session(req, sessionData);
    if (setReqSesion) {
      req.session = session;
      req.session.cookie = new Cookie(this.cookieOptions || {});
    }
    return session;
  }
}
