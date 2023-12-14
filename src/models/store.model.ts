import { Request } from "express";
import { SessionDataModel, SessionModel } from "./sesson.model";

export interface StoreModel {
  generate?: (req: Request) => void | Promise<void>;
  regenerate?: (req: Request) => void | Promise<void>;
  load?: (sid: string) => void | Promise<void>;
  createSession?: (
    req: Request,
    session: SessionModel
  ) => SessionModel | Promise<SessionModel>;
  get: (sid: string) => SessionModel | Promise<SessionModel>;
  set: (sid: string, session: SessionDataModel) => void;
  destroy: (sid: string) => void | Promise<void>;
  all?: () => void | Promise<void>;
  length?: () => void | Promise<void>;
  clear?: () => void | Promise<void>;
  touch?: () => void | Promise<void>;
}
