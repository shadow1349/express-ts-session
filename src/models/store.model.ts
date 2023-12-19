import { SessionDataModel } from "./sesson.model";

export interface StoreModel {
  /**
   * @required
   * @param {string} sid
   * @returns {void | Promise<void>}
   */
  set: (sid: string, data: SessionDataModel) => void | Promise<void>;
  /**
   * @required
   * @param {string} sid
   * @returns {SessionDataModel | Promise<SessionDataModel>}
   */
  get: (sid: string) => SessionDataModel | Promise<SessionDataModel>;
  /**
   * @required
   * @param {string} sid
   * @returns {void | Promise<void>}
   */
  destroy: (sid: string) => void | Promise<void>;
  /**
   * This will clear out the database of all sessions effectively deleting all sessions.
   * Be very very carefuly implementing this.ƒ
   * @optional
   * @returns {void | Promise<void>}
   */
  clear?: () => void | Promise<void>;
}
