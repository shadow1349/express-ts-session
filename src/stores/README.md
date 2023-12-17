# Stores

Stores are an important aspect of managing your sessions. These will hold all the data your store needs. This directory will hold all of the available stores you can use.

# Available Stores

- [Memory Store](./memory/README.md)
- [Firestore Store](https://github.com/shadow1349/express-ts-session-firestore)

# Creating your own store

Stores are pretty versitile, and creating your own is pretty easy. You can even follow the example of the memory store. You can do one of two things.

## 1. Extend the `Store` class

Extending the `Store` class gives you several important methods that you'll need right away.

- **generate**: This will call the genid/UUID method and setup the session on the request
- **regenerate**: This will destroy and existing session and create a new one using the destroy and generate methods of the `Store` class
- **load** - This will load an existing session based on the session id with the get method
- **createSession** - this will create a `Session` class based on existing session data

These methods will reference the get/set/destroy methods (when needed) so all you have to do is create get/set/destroy methods for your preferred database.

You can also override any of the above methods if you'd like as well. This is the preferred way to create a custom store, though not the only way.

```typescript
import { Store, SessionDataModel } from "express-ts-session";

export class MyStore extends Store {
  constructor() {
    super();
  }

  override set(sid: string, data: SessionDataModel): void | Promise<void> {
    // your logic goes here
  }

  override get(sid: string): SessionDataModel | Promise<SessionDataModel> {
    // your logic goes here
  }

  override destroy(sid): void | Promise<void> {
    // your logic goes here
  }
}
```

## 2. Implement the Store Model

If you'd rather start from scratch and implement your own store entirely you can do that also by implementing the `StoreModel`.

```typescript
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
   * @returns {AllSessionsModel | AllSessionsModel[] | Promise<AllSessionsModel> | Promise<AllSessionsModel[]>}
   */
  all?: () =>
    | AllSessionsModel
    | AllSessionsModel[]
    | Promise<AllSessionsModel>
    | Promise<AllSessionsModel[]>;
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
```

If you choose to go down this route you **MUST** implement these methods:

- **generate**: This will call the genid/UUID method and setup the session on the request
- **regenerate**: This will destroy and existing session and create a new one using the destroy and generate methods of the `Store` class
- **load** - This will load an existing session based on the session id with the get method
- **createSession** - this will create a `Session` class based on existing session data

Along with those methods you'll also need to implement the get/set/destroy methods as well.

I wouldn't recommend you do this unless your use case really calls for it.
