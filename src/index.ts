import { connectToDB, disconnectDB } from "./config";
import { startServer, stopServer } from "./server";

async function initializeApp() {
  try {
    await connectToDB();

    const server = await startServer();

    process.on("SIGINT", async () => {
      await disconnectDB();
      await stopServer(server);
      console.log("Server stopped and DB disconnected");
      process.exit(0);
    });
  } catch (error: any) {
    console.error("Error connecting to DB or starting server: ", error.message);
    process.exit(1);
  }
}

initializeApp();
