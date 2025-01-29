import { Request, Response, NextFunction } from "express";
import { IUser } from "../interfaces";
import { StatusCodes } from "../config";
import {
  findUserByUsername,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
} from "../controllers";
import jwt from "jsonwebtoken";
import { Config } from "../config";

type JWTPayload = {
  username: string;
  role: string;
  isBanned: boolean;
};

/**
 * Basic authentication check - verifies if valid token is present
 */
async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication token required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, Config.ACCESS_TOKEN_SECRET) as JWTPayload;

    req.user = {
      username: decoded.username,
      role: decoded.role,
      isBanned: decoded.isBanned,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token expired" });
      return;
    }
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token" });
  }
}

async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication token required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, Config.ACCESS_TOKEN_SECRET) as JWTPayload;

    const userDoc = await findUserByUsername(decoded.username);
    if (!userDoc) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "User account not found" });
      return;
    }

    if (userDoc.isBanned) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Account has been suspended" });
      return;
    }

    req.user = {
      username: userDoc.username,
      role: userDoc.role,
      isBanned: userDoc.isBanned,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token expired" });
      return;
    }
    console.error("Authentication error:", error);
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token" });
  }
}

function authorizeRoles(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Authentication required" });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: "Insufficient permissions to access this route" });
        return;
      }

      next();
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Authorization process failed" });
    }
  };
}

export { authGuard, authenticateUser, authorizeRoles };
