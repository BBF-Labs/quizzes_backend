import { Router, Request, Response } from "express";
import { Session } from "express-session";
import {
  generateAccessToken,
  verifyPassword,
  generateRefreshToken,
  findUserByEmail,
  findUserByUsername,
} from "../controllers";
import { authGuard, authenticateUser, authorizeRoles } from "../middlewares";
import { StatusCodes } from "../config";
import passport from "passport";

interface ILoginRequest {
  username: string;
  password: string;
}

interface ISessionUser {
  username: string;
  role: string;
  isBanned: boolean;
}

const authRoutes: Router = Router();

authRoutes.post(
  "/login",
  (req: Request<{}, {}, ILoginRequest>, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Username and password are required" });
        return;
      }

      passport.authenticate(
        "local",
        { session: true },
        (err: any, user: any, info: any) => {
          if (err) {
            res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ message: err.message });
            return;
          }

          if (!user) {
            res
              .status(StatusCodes.UNAUTHORIZED)
              .json({ message: info?.message || "Authentication failed" });
            return;
          }

          if (user.isBanned) {
            res
              .status(StatusCodes.FORBIDDEN)
              .json({ message: "User is banned" });
            return;
          }

          if (user.isDeleted) {
            res
              .status(StatusCodes.FORBIDDEN)
              .json({ message: "Account Deactivated" });
            return;
          }

          const sessionUser: ISessionUser = {
            username: user.username,
            role: user.role,
            isBanned: user.isBanned,
          };

          req.session.regenerate((err) => {
            if (err) {
              res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ message: "Failed to generate session" });
              return;
            }

            req.session.user = sessionUser;

            req.session.save((err) => {
              if (err) {
                res
                  .status(StatusCodes.INTERNAL_SERVER_ERROR)
                  .json({ message: "Failed to save session" });
                return;
              }

              res
                .status(StatusCodes.OK)
                .json({ message: "Success", user: sessionUser });
            });
          });
        }
      )(req, res);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message });
    }
  }
);

authRoutes.post("/logout", authenticateUser, (req: Request, res: Response) => {
  if (!req.session) {
    res.status(StatusCodes.OK).json({ message: "Already logged out" });
    return;
  }

  req.session.regenerate((regenerateErr) => {
    if (regenerateErr) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error during logout process" });
      return;
    }

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Failed to complete logout" });
        return;
      }

      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(StatusCodes.OK).json({
        message: "Logged out successfully",
        success: true,
      });
    });
  });
});

authRoutes.post(
  "/refresh-session",
  authenticateUser,
  (req: Request, res: Response) => {
    if (!req.session || !req.session.user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "No active session" });
      return;
    }

    const currentUser = req.session.user;

    req.session.regenerate((regenerateErr) => {
      if (regenerateErr) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Failed to refresh session" });
        return;
      }

      req.session.user = currentUser;

      req.session.save((saveErr) => {
        if (saveErr) {
          res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to save refreshed session" });
          return;
        }

        res.status(StatusCodes.OK).json({
          message: "Session refreshed successfully",
          success: true,
        });
      });
    });
  }
);

authRoutes.get("/session-status", authGuard, (req: Request, res: Response) => {
  if (!req.session || !req.session.user) {
    res.status(StatusCodes.OK).json({
      isAuthenticated: false,
      message: "No active session",
    });
    return;
  }

  res.status(StatusCodes.OK).json({
    isAuthenticated: true,
    user: req.session.user,
    message: "Active session found",
  });
});

export default authRoutes;
