import "express";

declare module "express-session" {
  interface Session {
    user?: {
      username: string;
      role: string;
    };
  }
}

export {};
