import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Config } from "./config";

let mongoServer: MongoMemoryServer;

async function connectToDB() {
  try {
    await mongoose.connect(Config.MONGO_URI);

    Config.ENV === "development" && console.log("Connected to Remote DB");
  } catch (error: any) {
    console.log("Error connecting to Remote DB: ", error.message);

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    Config.ENV === "development" && console.log("Connected to Local DB");
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export { connectToDB, disconnectDB };
