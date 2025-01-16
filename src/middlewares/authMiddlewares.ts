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

async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
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

async function authorizeRoles() {
  const roles = ["admin", "moderator"];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).send("You are not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .send("You are not authorized to perform this action");
    }
    next();
  };
}

export { authenticateUser, authorizeRoles };
