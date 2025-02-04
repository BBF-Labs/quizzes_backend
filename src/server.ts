import express, { Express, Request, Response, NextFunction } from "express";
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
import crypto from "crypto";

import cors from "cors";

const app: Express = express();

interface CustomResponse extends Response {
  locals: {
    nonce?: string;
  };
}

const nonceMiddleware = (
  req: Request,
  res: CustomResponse,
  next: NextFunction
) => {
  // Generate a unique nonce for each request
  const nonce = crypto.randomBytes(16).toString("base64");

  // Attach nonce to the request for use in rendering
  res.locals.nonce = nonce;

  // Set up CSP middleware with the generated nonce
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'strict-dynamic'",
        `'nonce-${nonce}'`,
        "https://apis.google.com",
      ],
      styleSrc: ["'self'", `'nonce-${nonce}'`, "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })(req, res, next);
};

async function startServer() {
  try {
    // 🛠️ request body parsers
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use((req: Request, res: CustomResponse, next: NextFunction) => {
      res.locals.nonce = crypto.randomBytes(16).toString("base64");
      next();
    });

    // 🛠️ security headers
    app.disable("x-powered-by");
    app.set("trust proxy", 1);

    // 🛠️ security and other middleware
    app.use(cors(CorsOption));
    app.use(helmet());
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-eval'", "https://apis.google.com"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
          },
        },
      })
    );

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

    // Error Handling & Logging Middleware
    app.use(ErrorHandler);
    app.use(Logger);

    // Root Route
    app.get("/", (req: Request, res: CustomResponse) => {
      const html = path.join(__dirname, "..", "public", "index.html");

      res.setHeader("Content-Security-Policy", "script-src self");

      res.send(html);
    });

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
