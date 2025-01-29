import express, { Express, Request, Response } from "express";
import { Config } from "./config";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./utils";
import { Limiter, ErrorHandler, Logger, CorsOption } from "./middlewares";
import helmet from "helmet";
import {
  userRoutes,
  authRoutes,
  adminRoutes,
  courseRoutes,
  questionRoutes,
  quizQuestionsRoutes,
  progressRoutes,
  materialRoutes,
} from "./routes";
import cors from "cors";

const app: Express = express();

async function startServer() {
  try {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.disable("x-powered-by");
    app.set("trust proxy", 1);
    app.use(Limiter);
    app.use(cors(CorsOption));
    app.use(helmet());
    app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.use("/api/v1/users", userRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/admin", adminRoutes);
    app.use("/api/v1/courses", courseRoutes);
    app.use("/api/v1/question", questionRoutes);
    app.use("/api/v1/quizzes", quizQuestionsRoutes);
    app.use("/api/v1/progress", progressRoutes);
    app.use("/api/v1/materials", materialRoutes);

    app.get("/", (req: Request, res: Response) => {
      res.send("Hello World");
    });

    app.use(ErrorHandler);
    app.use(Logger);

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
//
