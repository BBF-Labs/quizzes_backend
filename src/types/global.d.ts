import { Express } from "express";
import { IUser } from "../interfaces";

declare global {
  namespace Express {
    interface User {
      id?: string;
      username?: string;
      email?: string;
      password?: string;
      authKey?: string;
      course?: Types.ObjectId;
      role?: "student" | "admin" | "moderator";
      isBanned?: boolean;
      isSubscribed?: boolean;
      paymentId?: Types.ObjectId;
      lastLogin?: Date;
      isDeleted?: boolean;
    }
  }
}

export {};
