import { config } from "dotenv";
config();

const Config = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/test",
  ENV : process.env.NODE_ENV || "development"
};

export default Config;
