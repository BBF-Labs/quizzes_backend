import express, { Express, NextFunction, Request, Response } from "express";
import { Config } from "./config";
import {
  Limiter,
  Session,
  Passport,
  ErrorHandler,
  Logger,
} from "./middlewares";
import helmet from "helmet";
import { userRoutes, authRoutes } from "./routes";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("x-powered-by");
app.use(Limiter);
app.use(Session);
app.use(helmet());
app.use(Passport.initialize());
app.use(Passport.session());
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.use(ErrorHandler);
app.use(Logger);

async function startServer() {
  try {
    const server = app.listen(Config.PORT, () => {
      Config.ENV === "development" &&
        console.log(`Server running on http://localhost:${Config.PORT}`);
    });
    return server;
  } catch (error: any) {
    Config.ENV === "development" &&
      console.error("Error starting server: ", error.message);
    Config.ENV !== "development" && console.error("Error starting Server");
  }
}

async function stopServer(server: any) {
  try {
    server.close();
  } catch (error: any) {
    Config.ENV === "development" &&
      console.error("Error stopping server: ", error.message);
    Config.ENV !== "development" && console.error("Error stopping Server");
  }
}

export { startServer, stopServer };
