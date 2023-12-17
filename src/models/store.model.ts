import { Request } from "express";
import { Session } from "../classes";
import { SessionDataModel } from "./sesson.model";

export interface StoreModel {
  /**
   * This is the default generate method for when a new session is being generated.
   * It will be responsible for creating a new session using either the genid method passed in
   * OR it will generate a new UUID for the session.
   * @required
   * @param {Request} req
   * @returns {void | Promise<void>}
   */
  generate?: (req: Request) => void | Promise<void>;
  /**
   * This will destroy the session and generate a new one
   * Be careful when using this method as it will delete all the data
   * in the current session before a new one is created.
   * @required
   * @param {Request} req
   * @returns {void | Promise<void>}
   */
  regenerate?: (req: Request) => void | Promise<void>;
  /**
   * This will load an existing session from the store
   * and create a session on the request.
   * @required
   * @param {string} sid
   * @returns {void | Promise<void>}
   */
  load?: (sid: string) => void | Promise<void>;
  /**
   *
   * This will create a session based on the request and session data provided
   * @required
   * @param {Request} req
   * @param {SessionDataModel} sessionData
   * @param {Boolean} setReqSesion whether to set req.session in this function or not defaults to true
   * @returns {Session | Promise<Session>}
   */
  createSession?: (
    req: Request,
    session: SessionDataModel,
    setReqSesion?: boolean
  ) => Session | Promise<Session>;
  /**
   * This will retrieve a session from the store based on the session id provided
   * @param {string} sid
   * @returns {SessionDataModel | Promise<SessionDataModel>}
   */
  get: (sid: string) => SessionDataModel | Promise<SessionDataModel>;
  /**
   * This will insert session data into the chosen database
   * @param {string} sid
   * @param {SessionDataModel} session
   * @returns {void | Promise<void>}
   */
  set: (sid: string, session: SessionDataModel) => void | Promise<void>;
  /**
   * This will delete a session from the database based on the session id provided
   * @param {string} sid
   * @returns {void | Promise<void>}
   */
  destroy: (sid: string) => void | Promise<void>;
  /**
   * This will retrieve all sessions from the database
   * @returns {SessionDataModel[] | Promise<SessionDataModel[]>>}
   */
  all?: () => SessionDataModel[] | Promise<SessionDataModel[]>;
  /**
   * This will return the number of sessions in the database
   * @returns {number | Promise<number>}
   */
  length?: () => number | Promise<number>;
  /**
   * This will clear all of the sessions from the database
   * @returns {void | Promise<void>}
   */
  clear?: () => void | Promise<void>;
  /**
   * This will touch the session and update the maxAge
   * @param {string} sid
   * @param {string} session
   * @returns
   */
  touch?: (sid: string, session: Session) => void | Promise<void>;
}
