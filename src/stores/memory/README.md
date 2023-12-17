# Memory Store

The memory store is the default store if none is provided. It will store all the sessions locally. It's good for testing, but not much else. 

## Usage - DO NOT USE IN PRODUCTION

The usage of memory store is pretty simple. All you have to do is declare a new class

```typescript
import express from 'express';
import { ExpressTSSession, MemoryStore } from 'express-ts-sesion';

const app = express();

const session = new ExpressTSSession({
    name: 'my-app',
    secret: 'supersecretpassword-shh',
    store: new MemoryStore(),
});


```