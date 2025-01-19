import { Express } from "express";
import { IUser } from "./src/interfaces";

interface IUserSession {
  username: string;
  role: string;
}

declare module "express-session" {
  interface Session {
    user?: IUserSession;
  }
}

export {};
