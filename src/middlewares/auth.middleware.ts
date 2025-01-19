import { Request, Response, NextFunction } from "express";
import passport from "passport";
import * as passportStrategy from "passport-local";
import { findUserByUsername, verifyPassword } from "../controllers";
import { IUser } from "../interfaces";
import { StatusCodes } from "../config";

async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.session.user;

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "" });
      return;
    }

    const userDoc = await findUserByUsername(user.username);

    if (!userDoc) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "User not found" });
      return;
    }
    next();
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "There was an error processing request" });
  }
}

async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.session.user;

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

passport.deserializeUser(async (sessionUser: { username: string }, done) => {
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
