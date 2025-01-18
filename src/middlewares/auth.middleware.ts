import { Express, Request, Response, NextFunction } from "express";
import * as passportStrategy from "passport-local";
import {
  verifyToken,
  findUserByUsername,
  verifyPassword,
} from "../controllers";
import { IUser } from "../interfaces";
import passport from "passport";
import { StatusCodes } from "../config";

async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token is required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const tokenUser = await verifyToken(token);

    if (!tokenUser) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid Token" });
      return;
    }

    const user = await findUserByUsername(tokenUser.email);

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not found" });
      return;
    }

    req.user = user as IUser;
    next();
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid Token" });
  }
}

async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as IUser | undefined;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "You are not authenticated" });
      return;
    }

    next();
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
}

async function authorizeRoles() {
  const allowedRoles = ["admin", "moderator"];

  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser | undefined;

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "You are not authenticated" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "You are not authorized to perform this action" });
    }
    next();
  };
}

const Passport = passport.use(
  new passportStrategy.Strategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const user = await findUserByUsername(username);

        if (!user) {
          throw new Error("User does not exist");
        }

        const isValidPassword = await verifyPassword(password, user.password);
        if (user.username === username && isValidPassword) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error: any) {
        done(error.message);
      }

      passport.serializeUser((user: Partial<IUser>, done) => {
        done(null, user.username);
      });

      passport.deserializeUser(async (username: string, done) => {
        try {
          const user = await findUserByUsername(username);
          done(null, user);
        } catch (error: any) {
          done(error);
        }
      });
    }
  )
);

export { authenticateUser, authorizeRoles, Passport, authGuard };
