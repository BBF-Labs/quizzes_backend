import { connectToDB, disconnectDB } from "./config";
import { startServer, stopServer } from "./server";

connectToDB()
  .then(() => {
    startServer();
  })
  .catch((error: any) => {
    console.error("Error connecting to DB: ", error.message);
  });

process.on("SIGINT", async () => {
  await disconnectDB();
  await stopServer();
  console.log("Server stopped and DB disconnected");
  process.exit(0);
});
