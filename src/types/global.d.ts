import { Express } from "express";
import { IUser } from "../interfaces";

declare module "express-serve-static-core" {
  interface Request {
    user?: Partial<IUser>;
  }
}

export {};
