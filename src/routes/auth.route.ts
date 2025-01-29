import { Router, Request, Response } from "express";
import {
  generateAccessToken,
  verifyPassword,
  generateRefreshToken,
  verifyRefreshToken,
  findUserByUsername,
} from "../controllers";
import { authenticateUser } from "../middlewares";
import { StatusCodes } from "../config";

type JWTPayload = {
  username: string;
  role: "student" | "admin" | "moderator";
  isBanned: boolean;
};

const authRoutes: Router = Router();

authRoutes.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await findUserByUsername(username);

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "User does not exist" });
      return;
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid password" });
      return;
    }

    if (user.isBanned) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Account has been suspended" });
      return;
    }

    const payload: JWTPayload = {
      username: user.username,
      role: user.role,
      isBanned: user.isBanned,
    };

    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    res.json({
      accessToken,
      refreshToken,
      user: payload,
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Login process failed" });
  }
});

authRoutes.post(
  "/refresh",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Refresh token is required",
        });
        return;
      }

      const decoded = await verifyRefreshToken(refreshToken);

      const accessToken = await generateAccessToken(decoded);

      res.json({
        accessToken,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Token refresh failed",
      });
    }
  }
);

export default authRoutes;
