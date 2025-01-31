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

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Log in a user to get tokens and user details.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                 user:
 *                   type: object
 *                   description: User information
 *                   properties:
 *                     username:
 *                       type: string
 *                       description: The user's username
 *                     role:
 *                       type: string
 *                       description: The user's role
 *                     isBanned:
 *                       type: boolean
 *                       description: Whether the user is banned
 *       401:
 *         description: Unauthorized - Invalid credentials
 *       403:
 *         description: Forbidden - User is banned
 *       500:
 *         description: Internal server error
 */
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

    res.status(StatusCodes.OK).json({
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

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using a valid refresh token
 *     tags:
 *       - Auth
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token
 *       400:
 *         description: No refresh token provided
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Internal server error
 */

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

      const decoded = (await verifyRefreshToken(refreshToken)) as JWTPayload;

      if (!decoded) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid refresh token",
        });
        return;
      }

      const accessToken = await generateAccessToken(decoded);

      res.status(StatusCodes.OK).json({
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
