import { StoreModel } from "../../models";
import { SessionDataModel } from "../../models";

export class MemoryStore implements StoreModel {
  private sessions: { [sid: string]: SessionDataModel } = {};

  get(sid: string): SessionDataModel {
    const existingSession = this.sessions[sid];
    if (!existingSession)
      throw new Error(
        "There is no existing session in the store but a cookie was sent with a session id"
      );

    return existingSession;
  }

  set(sid: string, data: SessionDataModel) {
    this.sessions[sid] = data;
  }

  destroy(sid: string): void | Promise<void> {
    delete this.sessions[sid];
  }

  clear() {
    this.sessions = Object.create(null);
  }
}
