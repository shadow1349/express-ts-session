import { Request } from "express";
import { StoreModel } from "../models/store.model";
import { uuid } from "../util";

export class DefaultStore implements StoreModel {
  generate(req: Request) {
    req.sessionId = uuid();
  }
}
