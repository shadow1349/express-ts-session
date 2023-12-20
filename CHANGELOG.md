# 0.0.1-beta.5

The library has been simplified in terms of what options are available. I paired down the options to the bare essesntials, removed the Cookie class and left them as just an interface. I also removed a lot of logic from the store and the session as there seemed to be a ton of duplicate logic. 

# 0.0.1-beta.4

I have updated the way that sessions are created in the middleware. Memory store will throw an error in the get method if nothing is returned. The get method must throw an error if the store doesn't have an existing session. The client may send the API a session cookie while there is no session in the database. If that happens the new changes will ensure that the error is caught and a new session is generated and sent to the user.

# 0.0.1-beta.3

If you pass in a custom genid method, it will never get called because of how everything is set up. So I decided to just set genid on the request so it's accessible where I need it. This should fix any issues setting a custom genid method.

Fixes [https://github.com/users/shadow1349/projects/2?pane=issue&itemId=47782483](https://github.com/users/shadow1349/projects/2?pane=issue&itemId=47782483)

# 0.0.1-beta.2

This is the second beta release which adds declarations to the codebase to help TypeScript recognize types which was missing from the first beta release. It also adds more jsdoc to the codebase.

# 0.0.1-beta.1

This is the initial beta release. It has minimal functionality at the moment, but more development is expected in the future.
