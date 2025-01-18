import { Express } from "express";
import { IUser } from "../interfaces";

declare global {
  namespace Express {
    interface User extends Partial<IUser> {}
  }
}

export {};
