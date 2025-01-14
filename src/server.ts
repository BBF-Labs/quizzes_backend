import express, { Express, Request, Response } from "express";
import { Config } from "./config";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

async function startServer() {
  try {
    app.listen(Config.PORT, () => {
      Config.ENV === "development" &&
        console.log(`Server running on http://localhost:${Config.PORT}`);
    });
  } catch (error: any) {
    Config.ENV === "development" &&
      console.error("Error starting server: ", error.message);
    Config.ENV !== "development" && console.error("Error starting Server");
  }
}

export default startServer;
