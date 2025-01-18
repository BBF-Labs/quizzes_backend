import express, { Express, NextFunction, Request, Response } from "express";
import { Config } from "./config";
import {
  Limiter,
  sessionMiddleware,
  Passport,
  ErrorHandler,
  Logger,
} from "./middlewares";
import helmet from "helmet";
import { userRoutes } from "./routes";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(Limiter);
app.use(sessionMiddleware);
app.use(helmet());
app.use(Passport.initialize());
app.use("/api/v1/users", userRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.use(ErrorHandler);
app.use(Logger);

const server = app.listen(Config.PORT, () => {
  Config.ENV === "development" &&
    console.log(`Server running on http://localhost:${Config.PORT}`);
});

async function startServer() {
  try {
    return server;
  } catch (error: any) {
    Config.ENV === "development" &&
      console.error("Error starting server: ", error.message);
    Config.ENV !== "development" && console.error("Error starting Server");
  }
}

async function stopServer() {
  try {
    server.close();
  } catch (error: any) {
    Config.ENV === "development" &&
      console.error("Error stopping server: ", error.message);
    Config.ENV !== "development" && console.error("Error stopping Server");
  }
}

export { startServer, stopServer };
