export * from "./classes";
export * from "./middleware";
export * from "./models";
export * from "./util";

import express from "express";
import { Cookie } from "./classes";
import { ExpressTSSession } from "./middleware";

const app = express();

const session = new ExpressTSSession({
  secret: "test",
  cookie: new Cookie({
    maxAge: 1000 * 60 * 60 * 24 * 7,
    secure: false,
    httpOnly: true,
    path: "/",
    sameSite: false,
    signed: true,
  }),
  name: "test",
});

app.use(session.init);

app.get("/", (req, res) => {
  req.session["test"] = "123";
  res.json({ response: "Hello World" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
