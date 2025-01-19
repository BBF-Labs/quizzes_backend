import { config } from "dotenv";
config();

const Config = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/test",
  ENV: process.env.NODE_ENV || "development",
  SESSION_SECRET: process.env.SESSION || "someBBFLabsSecret",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
  SALT_ROUNDS: process.env.SALT_ROUNDS! || 10,
  LOG_LEVEL: "debug",
};

const StatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export { Config, StatusCodes };
