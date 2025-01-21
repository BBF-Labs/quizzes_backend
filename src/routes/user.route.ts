import { Router, Request, Response } from "express";
import { createUser, findUserByUsername, updateUser } from "../controllers";
import { authGuard, authenticateUser } from "../middlewares";
import { StatusCodes } from "../config";

const userRoutes: Router = Router();

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user in the system. Only users with a valid email and a password of at least 8 characters can be registered. If the role is not specified, it defaults to "student".
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *               role:
 *                 type: string
 *                 description: The user's role. Default is "student".
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Invalid request data or user already exists.
 *       500:
 *         description: Internal server error.
 */
userRoutes.post("/register", async (req: Request, res: Response) => {
  try {
    const user = req.body;

    if (!user || !user.email || !user.password) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid request data" });
      return;
    }

    if (user.role) {
      user.role = "student";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid email format" });
      return;
    }

    if (user.password.length < 8) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Password must be at least 8 characters long" });
      return;
    }

    const newUser = await createUser(user);

    if (!newUser) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User already exists" });
      return;
    }

    res.status(StatusCodes.CREATED).json({ message: "Success", newUser });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error", error: err.message });
  }
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the profile of the currently authenticated user.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: The username of the user.
 *                 role:
 *                   type: string
 *                   description: The role of the user.
 *                 isBanned:
 *                   type: boolean
 *                   description: Whether the user is banned or not.
 *       401:
 *         description: Unauthorized user.
 *       404:
 *         description: User profile not found.
 *       500:
 *         description: Internal server error.
 */
userRoutes.get(
  "/profile",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.username) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "User not found" });
        return;
      }

      const username = req.session.user.username;
      const userDoc = await findUserByUsername(username);

      if (!userDoc) {
        res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User profile not found" });
        return;
      }

      res.status(StatusCodes.OK).json({ message: "Success", userDoc });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error", error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/update:
 *   put:
 *     summary: Update user profile
 *     description: Update the profile of the currently authenticated user. Only admins can change user roles.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The new username.
 *               role:
 *                 type: string
 *                 description: The new role. Only admins can change the role.
 *               isBanned:
 *                 type: boolean
 *                 description: Whether the user is banned.
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       400:
 *         description: Invalid request data.
 *       401:
 *         description: Unauthorized request.
 *       403:
 *         description: Forbidden, non-admins cannot change the role.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */
userRoutes.put(
  "/update",
  authenticateUser,
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const user = req.session.user;

      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "You are not authorized to perform this action" });
        return;
      }

      const userDoc = await findUserByUsername(user.username);

      if (!userDoc) {
        res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
        return;
      }

      const updates = req.body;
      if (!updates) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Invalid Request" });
        return;
      }

      if (updates.role && user.role !== "admin") {
        res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: "You are not authorized to perform this action" });
        return;
      }

      await updateUser(userDoc.id, updates);

      req.session.regenerate((err) => {
        if (err) {
          res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Error regenerating session" });
          return;
        }

        req.session.user = {
          username: updates.username || userDoc.username,
          isBanned: updates.isBanned ?? userDoc.isBanned,
          role: updates.role || userDoc.role,
        };

        req.session.save((err) => {
          if (err) {
            res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ message: "Error saving session" });
            return;
          }
          res
            .status(StatusCodes.OK)
            .json({ message: "User updated successfully" });
        });
      });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error", error: err.message });
    }
  }
);

export default userRoutes;
