import { CorsOptions } from "cors";
import { Config } from "../config";

const CorsOption: CorsOptions = {
  origin:
    Config.ENV === "production"
      ? [
          /^(https?:\/\/.*\.bflabs\.tech)$/i,
          "https://theminiscripts.vercel.app",
          "https://www.theminiscripts.vercel.app",
        ]
      : [
          "http://localhost:5500",
          "http://127.0.0.1:5500",
          "http://localhost:3000",
          "http://127.0.0.1",
          `http://localhost:${Config.PORT}`,
        ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export { CorsOption };
