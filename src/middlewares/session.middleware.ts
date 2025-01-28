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

const startSession = async () => {
  await connectToDB();

  const sessionStore = MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: "sessions",
    ttl: 60 * 60 * 24, // 1 day
    autoRemove: "native",
    touchAfter: 24 * 3600,
    crypto: {
      secret: Config.SESSION_SECRET,
    },
  });

  sessionStore.on("error", (error) => {
    if (Config.ENV === "development") {
      console.error("Session Store Error: ", error);
    }
    console.error("Session Store Error");
  });
  const Session = session({
    secret: Config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: "sid",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: "none",
      secure: Config.ENV === "production",
      httpOnly: true,
    },
    store: sessionStore,
    genid: genUUID,
  });

  return Session;
};

export { Limiter, startSession };
