import { NextFunction, Request } from "express";
import { SessionOptionsModel } from "./models";

export class ExpressTSSession {
  private ready: boolean = false;
  private originalHash?: string;
  private originalId?: string;
  private savedHash?: string;
  private cookieId?: string;

  constructor(private opts: Partial<SessionOptionsModel>) {
    if (this.opts.secret && !Array.isArray(this.opts.secret))
      this.opts.secret = [this.opts.secret];
  }

  session(req: Request, res: Response, next: NextFunction) {
    console.log("init: ", req, res);
    next();
  }
}
