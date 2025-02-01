import { config } from "dotenv";
config();

const Config = {
  PORT: process.env.PORT!,
  MONGO_URI: process.env.MONGO_URI!,
  ENV: process.env.NODE_ENV,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS!),
  LOG_LEVEL: process.env.LOG_LEVEL!,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY!,
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

const FirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.FIREBASE_DATABASE_URL!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.FIREBASE_APP_ID!,
};

export { Config, StatusCodes, FirebaseConfig };
