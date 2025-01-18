import { connectToDB, disconnectDB } from "./config";
import { startServer, stopServer } from "./server";

async function initializeApp() {
  try {
    await connectToDB();

    await startServer();
  } catch (error: any) {
    console.error("Error connecting to DB: ", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await disconnectDB();
  await stopServer();
  console.log("Server stopped and DB disconnected");
  process.exit(0);
});

initializeApp();
