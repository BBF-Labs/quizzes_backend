import { Request, Response, NextFunction } from "express";
import { IUser } from "../interfaces";
import { verifyToken } from "./controllers";

declare global {
  namespace Express {
    interface Request {
      user?: Partial<IUser>;
    }
  }
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("Token is required");
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
}

export default authMiddleware;
