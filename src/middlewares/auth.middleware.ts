import { Express, Request, Response, NextFunction } from "express";
import * as passportStrategy from "passport-local";
import {
  verifyToken,
  findUserByUsername,
  verifyPassword,
} from "../controllers";
import { IUser } from "../interfaces";
import passport from "passport";

interface RequestWithUser extends Request {
  user?: IUser;
}

async function authenticateUser(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("Token is required");
  }

  const token = authHeader.split(" ")[1];

  try {
    const tokenUser = await verifyToken(token);

    if (!tokenUser) {
      return res.status(401).send("Invalid Token");
    }

    const user = await findUserByUsername(tokenUser.email);

    if (!user) {
      return res.status(401).send("User not found");
    }

    req.user = user as IUser;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
}

async function authorizeRoles() {
  const allowedRoles = ["admin", "moderator"];

  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const user = req.user as IUser | undefined;

    if (!user) {
      return res.status(401).send("You are not authenticated");
    }

    if (!allowedRoles.includes(user.role)) {
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

export { authenticateUser, authorizeRoles, Passport };
