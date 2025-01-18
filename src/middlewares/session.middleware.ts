import rateLimit from "express-rate-limit";
import session from "express-session";
import { Config, connectToDB } from "../config";
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

async function initializeSessionMiddleware() {
  // Wait until the database is connected
  if (!mongoose.connection.readyState) {
    await connectToDB();
  }

  const sessionMiddleware = session({
    secret: Config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Set to false for production
    cookie: {
      secure: Config.ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    genid: function () {
      return genUUID();
    },
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
    }),
  });

  return sessionMiddleware;
}

export { Limiter, initializeSessionMiddleware };
