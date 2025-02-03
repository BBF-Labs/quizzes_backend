import express, { Express, Request, Response } from "express";
import path from "path";
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
  paymentRoutes,
} from "./routes";
import cors from "cors";

const app: Express = express();

const cspOptions = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'sha256-tE/NNv952uo0aoX+Fb3dgVaYwcz+0QLXsW61gwiz0QU='",
    ],
    styleSrc: ["'self'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:"],
  },
};

async function startServer() {
  try {
    // 🛠️ request body parsers
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.disable("x-powered-by");
    app.set("trust proxy", 1);

    // 🛠️ security and other middleware
    app.use(cors(CorsOption));
    app.use(helmet());
    app.use(helmet.contentSecurityPolicy(cspOptions));
    app.use(Limiter);

    //static files
    app.use(express.static(path.join(__dirname, "..", "public")));

    // Swagger Docs
    app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Routes
    app.use("/api/v1/user", userRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/admin", adminRoutes);
    app.use("/api/v1/courses", courseRoutes);
    app.use("/api/v1/question", questionRoutes);
    app.use("/api/v1/quizzes", quizQuestionsRoutes);
    app.use("/api/v1/progress", progressRoutes);
    app.use("/api/v1/materials", materialRoutes);
    app.use("/api/v1/payments", paymentRoutes);

    // Root Route
    app.get("/", (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "..", "public", "index.html"));
    });

    // Error Handling & Logging Middleware
    app.use(ErrorHandler);
    app.use(Logger);

    // Start Server
    const server = app.listen(Config.PORT, () => {
      if (Config.ENV === "development") {
        console.log(`🚀 Server running on http://localhost:${Config.PORT}`);
      }
    });

    return server;
  } catch (error: any) {
    console.error(`❌ Error starting server: ${error.message}`);
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
