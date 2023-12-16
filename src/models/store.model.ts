import { Request } from "express";
import { Session } from "../classes";
import { SessionDataModel } from "./sesson.model";

export interface StoreModel {
  generate?: (req: Request) => void | Promise<void>;
  regenerate?: (req: Request) => void | Promise<void>;
  load?: (sid: string) => void | Promise<void>;
  createSession?: (
    req: Request,
    session: SessionDataModel,
    setReqSesion?: boolean
  ) => Session | Promise<Session>;
  get: (sid: string) => SessionDataModel | Promise<SessionDataModel>;
  set: (sid: string, session: SessionDataModel) => void;
  destroy: (sid: string) => void | Promise<void>;
  all?: () => void | Promise<void>;
  length?: () => number | Promise<number>;
  clear?: () => void | Promise<void>;
  touch?: (sid: string, session: Session) => void | Promise<void>;
}
