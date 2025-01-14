import { connectToDB, disconnectDB } from "./config";
import startServer from "./server";

connectToDB()
  .then(() => {
    startServer();
  })
  .catch((error: any) => {
    console.error("Error connecting to DB: ", error.message);
  });

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});
