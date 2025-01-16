import { config } from "dotenv";
config();

const Config = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/test",
  ENV: process.env.NODE_ENV || "development",
  SESSION_SECRET: process.env.SESSION || "someBBFLabsSecret",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  SALT_ROUNDS: process.env.SALT_ROUNDS || 10,
};

export default Config;
