import { Request, Response, NextFunction } from "express";
import passport from "passport";
import * as passportStrategy from "passport-local";
import {
  verifyToken,
  findUserByUsername,
  verifyPassword,
} from "../controllers";
import { IUser } from "../interfaces";
import { StatusCodes } from "../config";

async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const tokenUser = await verifyToken(token);

    if (!tokenUser) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid Token" });
    }

    const user = await findUserByUsername(tokenUser.email);

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token" });
    } else {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  }
}

function authGuard(req: Request, res: Response, next: NextFunction): void {
  const user = req.session.user;

  if (!user) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "You are not authenticated" });
    return;
  }

  next();
}

function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session.user;

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "You are not authenticated" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
}

passport.serializeUser((user: Partial<IUser>, done) => {
  const sessionUser = {
    username: user.username!,
    role: user.role!,
  };
  done(null, sessionUser);
});

passport.deserializeUser(async (sessionUser: any, done) => {
  try {
    const user = await findUserByUsername(sessionUser.username);
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
});

const Passport = passport.use(
  new passportStrategy.Strategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const user = await findUserByUsername(username);

        if (!user) {
          return done(null, false, { message: "User does not exist" });
        }

        const isValidPassword = await verifyPassword(password, user.password);

        if (isValidPassword) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Invalid password" });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

export { authenticateUser, authorizeRoles, Passport, authGuard };
