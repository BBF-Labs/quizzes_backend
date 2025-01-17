import { Request, Response, NextFunction } from "express";
import * as passportStrategy from "passport-local";
import { verifyToken, findUserByUsername } from "./controllers";
import { IUser } from "../interfaces";
import passport from "passport";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
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

const Passport = passport.use(
  new passportStrategy.Strategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const user = await findUserByUsername(username);
        const isValidPassword = await verifyPassword(password, user.password);
        if (user.username === username && isValidPassword) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error: any) {
        done(e);
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

export { authenticateUser, authorizeRoles, Passport };
