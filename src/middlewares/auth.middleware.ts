import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "../config";
import { findUserByUsername, verifyPassword } from "../controllers";
import passport from "passport";
import * as passportStrategy from "passport-local";
import { IUser } from "../interfaces";

interface SerializedUser {
  username: string;
  role: string;
  isBanned: boolean;
}

/**
 * Basic authentication check - verifies if user is logged in
 */
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
        .json({ message: "Login required to access this route" });
      return;
    }

    next();
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
}

/**
 * Full authentication check - verifies session, user exists in DB, and user status
 */
async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Login required to access this route" });
      return;
    }

    const userDoc = await findUserByUsername(sessionUser.username);
    if (!userDoc) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction failed:", err);
        }
      });

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

    req.session.user = {
      username: userDoc.username,
      role: userDoc.role,
      isBanned: userDoc.isBanned,
    };

    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Authentication process failed" });
  }
}

/**
 * Role-based authorization check
 */
function authorizeRoles(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.session.user;

      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Login required to access this route" });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
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

passport.serializeUser((user: Partial<IUser>, done) => {
  try {
    if (!user.username || !user.role) {
      throw new Error("Invalid user data for serialization");
    }

    const sessionUser: SerializedUser = {
      username: user.username,
      role: user.role,
      isBanned: user.isBanned || false,
    };

    done(null, sessionUser);
  } catch (error) {
    done(error);
  }
});

passport.deserializeUser(async (serializedUser: SerializedUser, done) => {
  try {
    if (!serializedUser.username) {
      throw new Error("Invalid session data");
    }

    const user = await findUserByUsername(serializedUser.username);

    if (!user) {
      return done(null, false);
    }

    if (user.isBanned) {
      return done(new Error("User is banned"), false);
    }

    if (user.isDeleted) {
      return done(new Error("Account is deactivated"), false);
    }

    const sanitizedUser = {
      username: user.username,
      role: user.role,
      isBanned: user.isBanned,
      isDeleted: user.isDeleted,
    };

    done(null, sanitizedUser);
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

export { authGuard, authenticateUser, authorizeRoles, Passport };
