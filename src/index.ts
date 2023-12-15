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
  }),
  name: "test",
});

app.use(
  session.init
  //   expressTsSession({
  //     cookie: new Cookie({
  //       maxAge: 1000 * 60 * 60 * 24 * 7,
  //       secure: false,
  //       httpOnly: true,
  //       path: "/",
  //       sameSite: false,
  //     }),
  //     name: "test",
  //   })
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
