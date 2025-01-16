import rateLimit from "express-rate-limit";
import session from "express-session";
import { Config } from "../config";
import { v4 as uuidv4 } from "uuid";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

const Limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: { error: "Too many requests, please try again later" },
  handler: (req, res) => {
    res
      .status(429)
      .send({ error: "Too many requests, please try again later" });
  },
  legacyHeaders: true,
  standardHeaders: "draft-8",
});

const genUUID = () => {
  return uuidv4();
};

const sessionMiddleware = session({
  secret: Config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // would be false when log in is implemented
  cookie: {
    secure: Config.ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
  genid: function (req) {
    return genUUID();
  },
  store: MongoStore.create({
    client: mongoose.connection.getClient(),
  }),
});

export { Limiter, sessionMiddleware };
