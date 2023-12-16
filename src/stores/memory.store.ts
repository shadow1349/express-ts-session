import { Store } from "../classes";
import { SessionDataModel } from "../models";

export class MemoryStore extends Store {
  private sessions: { [sid: string]: SessionDataModel } = {};

  get(sid: string): SessionDataModel {
    const existingSession = this.sessions[sid];
    if (!existingSession) return {};

    return existingSession;
  }

  set(sid: string, data: SessionDataModel) {
    this.sessions[sid] = data;
  }

  destroy(sid: string): void | Promise<void> {
    delete this.sessions[sid];
  }

  length(): number {
    return Object.keys(this.sessions).length;
  }

  all(): SessionDataModel[] {
    return Object.values(this.sessions);
  }

  touch(sid: string, data: SessionDataModel): void | Promise<void> {
    const currentSession = this.get(sid);

    if (currentSession && currentSession.cookie && data.cookie) {
      currentSession.cookie = data.cookie;
      this.set(sid, currentSession);
    }
  }

  clear() {
    this.sessions = Object.create(null);
  }
}
