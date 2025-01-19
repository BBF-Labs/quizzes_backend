import { Router, Request, Response } from "express";
import { Session } from "express-session";
import {
  generateAccessToken,
  verifyPassword,
  generateRefreshToken,
  findUserByEmail,
  findUserByUsername,
} from "../controllers";
import { StatusCodes } from "../config";
import passport from "passport";

const authRoutes: Router = Router();

authRoutes.post("/login", (req: Request, res: Response) => {
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

        const sessionUser = { username: user.username, role: user.role };

        req.session.user = sessionUser;
        res
          .status(StatusCodes.OK)
          .json({ message: "Success", user: sessionUser });
      }
    )(req, res);
  } catch (error: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
});

export default authRoutes;
