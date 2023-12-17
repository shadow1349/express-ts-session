# Express TS Session

Express TS Session is an implementation of express-session written in TypeScript and simplified using promises as opposed to callbacks. Express TS Session is more extensible and flexible by using OOP design.

## Read before using

Express TS Sessopm is curently in beta, so if you use it expect for there to be bugs. Please don't use this in production yet.

# Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Express TS Session Middleware Options](#express-ts-session-middleware-options)
- [Stores](./src/stores/README.md)

# Installation

```
npm install express-ts-session
```

# Usage

There is no default export for express-ts-session, so when you use it you should import the ExpressTSSession class. Here is a very basic usage example:

```typescript
import { ExpressTSSession, Cookie } from "express-ts-sesion";
import express from 'express';

const sessionMiddleware = new ExpressTSSession({
    name: "my-app"
    secret: "mysecret",
    cookie: new Cookie({
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: false,
        httpOnly: true,
        path: "/",
        sameSite: false,
        signed: true,
    })
});

const app = express();

app.use(sessionMiddleware.init);
```

## Express TS Session Middleware Options

These are all the available options for the `ExpressTSSession` class.

**cookie** - optional

The middleware accepts a `Cookie` class as an option. See [Cookie Options](#cookie-options) section.

```typescript
// this is the default cookie that will be created if none is passed in
new Cookie({
  maxAge: 9000,
  signed: true,
  httpOnly: true,
  path: "/",
  secure: false,
  encode: encodeURIComponent,
  sameSite: false,
});
```

**genid** - optional

This is a function to call to generate a new session ID. Provide a function that returns a `string` or a `Promise<string>`
that will be used as a session ID. The function is given the request as the first argument if you want to use some
value attached to it when generating completeley unique IDs.

The default value is a custom UUID function to generate IDs.
Be careful to generate unique IDs so your sessions do not conflict.

Examples:

```typescript
// this is the default functionality
function genId(req: Request) {
  return uuid();
}
```

If you wanted to call an external service to generate special IDs you can do that with a promise.

```typescript
async function genId(req: Request) {
  return http
    .get("https://id-api/generateid")
    .then((response) => response.data.id);
}
```

**name** - optional

The name of the session ID cookie to set in the response (and read from in the request).

Note if you have multiple apps running on the same hostname (this is just the name, i.e. `localhost` or `127.0.0.1`; different schemes and ports do not name a different hostname),
then you need to separate the session cookies from each other. The simplest method is to simply set different names per app.

The default is `connect.sid`.

**proxy** - optional

Trust the reverse proxy when setting secure cookies (via the "X-Forwarded-Proto" header).

- `true`: The `X-Forwarded-Proto` header will be used.
- `false`: All headers are ignored and the connection is considered secure only if there is a direct TLS/SSL connection.
- `default`: Uses the "trust proxy" setting from express

**resave** - optional

Forces the session to be saved back to the session store, even if the session was never modified during the request.
Depending on your store this may be necessary, but it can also create race conditions where a client makes two parallel requests to your server and changes made to the session in one request may get overwritten when the other request ends, even if it made no changes (this behavior also depends on what store you're using).

How do I know if this is necessary for my store? The best way to know is to check with your store if it implements the `touch` method.
If it does, then you can safely set `resave: false`.
If it does not implement the `touch` method and your store sets an expiration date on stored sessions, then you likely need `resave: true`.

This will default to `true`.

**rolling** - optional

Force the session identifier cookie to be set on every response. The expiration is reset to the original `maxAge`, resetting the expiration countdown.

The default value is `false`.

With this enabled, the session identifier cookie will expire in `maxAge` _since the last response was sent_ instead of in `maxAge` _since the session was last modified by the server_.
This is typically used in conjuction with short, non-session-length `maxAge` values to provide a quick timeout of the session data with reduced potential of it occurring during on going server interactions.

Note that when this option is set to `true` but the `saveUninitialized` option is set to `false`, the cookie will not be set on a response with an uninitialized session.
This option only modifies the behavior when an existing session was loaded for the request.

**saveUninitialized** - optional

Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.

Choosing `false` is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie.

Choosing `false` will also help with race conditions where a client makes multiple parallel requests without a session.

**secret - required**

This is the secret used to sign the session cookie. This can be either a string for a single secret, or an array of multiple secrets.
If an array of secrets is provided, **only the first element will be used to sign** the session ID cookie, while **all the elements will be considered when verifying the signature** in requests.

The secret itself should be not easily parsed by a human and would best be a random set of characters

Best practices may include:

- The use of environment variables to store the secret, ensuring the secret itself does not exist in your repository.
- Periodic updates of the secret, while ensuring the previous secret is in the array.

Using a secret that cannot be guessed will reduce the ability to hijack a session to only guessing the session ID (as determined by the `genid` option).

Changing the secret value will invalidate all existing sessions.
In order to rotate the secret without invalidating sessions, provide an array of secrets, with the new secret as first element of the array, and including previous secrets as the later elements.

**store** - optional

The session store instance, defaults to a new `MemoryStore` instance. Be careful, if you use a MemoryStore all your data will be completely lost if your server restarts. This makes MemoryStore not ideal for production use cases.

**unset** - optional

Control the result of unsetting req.session (through delete, setting to null, etc.).

- `destroy`: The session will be destroyed (deleted) when the response ends.
- `keep`: The session in the store will be kept, but modifications made during the request are ignored and not saved.

This will default to `keep`.

## Cookie Options

These are all the available options for the `Cookie` class.

**originalMaxAge** - optional

Returns the original `maxAge` (time-to-live), in milliseconds, of the session cookie.

This will default to `9000`

**maxAge** - optional

Indicates the number of seconds until the cookie expires. A zero or negative number will expire the cookie immediately. If both Expires and Max-Age are set, Max-Age has precedence.

This will default to `9000`

**signed** - optional

Indicates if the cookie is to be signed. This can be used to detect if the cookie has been tampered with.

This will default to `true`.

**expires** - optional

Indicates the maximum lifetime of the cookie as an HTTP-date timestamp. See Date for the required formatting.

If unspecified, the cookie becomes a session cookie. A session finishes when the client shuts down, after which the session cookie is removed.

When an Expires date is set, the deadline is relative to the client the cookie is being set on, not the server.

WARNING: Many web browsers have a session restore feature that will save all tabs and restore them the next time the browser is used.
Session cookies will also be restored, as if the browser was never closed.

**httpOnly** - optional

Specifies the boolean value for the `HttpOnly Set-Cookie` attribute. When truthy, the `HttpOnly` attribute is set, otherwise it is not.

By default, the `HttpOnly` attribute is set.

Be careful when setting this to `true`, as compliant clients will not allow client-side JavaScript to see the cookie in `document.cookie`.

This will default to `true`.

**path** - optional

Specifies the value for the `Path Set-Cookie` attribute.
By default, this is set to '/', which is the root path of the domain.

**domain** - optional

Specifies the value for the `Domain Set-Cookie` attribute.
By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.

**secure** - optional

Specifies the boolean value for the `Secure Set-Cookie` attribute. When truthy, the `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.

Be careful when setting this to true, as compliant clients will not send the cookie back to the server in the future if the browser does not have an HTTPS connection.

Please note that `secure: true` is a **recommended option**.
However, it requires an https-enabled website, i.e., HTTPS is necessary for secure cookies.

If `secure` is set, and you access your site over HTTP, **the cookie will not be set**.

The cookie.secure option can also be set to the special value `auto` to have this setting automatically match the determined security of the connection.

Be careful when using this setting if the site is available both as HTTP and HTTPS, as once the cookie is set on HTTPS, it will no longer be visible over HTTP.

This is useful when the Express "trust proxy" setting is properly setup to simplify development vs production configuration.

**sameSite** - optional

Specifies the boolean or string to be the value for the `SameSite Set-Cookie` attribute.

- `true` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
- `false` will not set the `SameSite` attribute.
- `lax` will set the `SameSite` attribute to `Lax` for lax same site enforcement.
- `none` will set the `SameSite` attribute to `None` for an explicit cross-site cookie.
- `strict` will set the `SameSite` attribute to `Strict` for strict same site enforcement.

More information about the different enforcement levels can be found in the specification.

**Note:** This is an attribute that has not yet been fully standardized, and may change in the future.
This also means many clients may ignore this attribute until they understand it.
