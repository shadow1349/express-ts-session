import { Request } from "express";
import { SessionDataModel } from "./sesson.model";
import EventEmitter from "events";

export interface StoreModel extends EventEmitter {
  generate?: (req: Request) => void;
  regenerate?: (req: Request) => void;
  load?: (sid: string) => void;
  createSession?: (req: Request, session: SessionDataModel) => SessionDataModel;
  get?: () => void;
  set?: () => void;
  destroy?: () => void;
  all?: () => void;
  length?: () => void;
  clear?: () => void;
  touch?: () => void;
}
