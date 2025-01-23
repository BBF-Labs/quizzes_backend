import { Router, Request, Response } from "express";
import { createUser, findUserByEmail, updateUser } from "../controllers";
import { authGuard, authenticateUser } from "../middlewares";
import { findUserByUsername } from "../controllers";
import { Config, StatusCodes } from "../config";
import { IUser } from "../interfaces";

const userRoutes: Router = Router();

userRoutes.post("/register", async (req: Request, res: Response) => {
  try {
    const user = req.body;

    if (!user || !user.email || !user.password) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid request data" });
      return;
    }

    // if (user.role) {
    //   user.role = "student";
    // }

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

    res.status(StatusCodes.CREATED).json({ message: "Success", user: user });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Error", error: err.message });
  }
});

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

      res.status(StatusCodes.OK).json({ message: "Success", user: userDoc });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error", error: err.message });
    }
  }
);

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

      const updatedUserDoc = await updateUser(userDoc._id.toString(), updates);

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
            .json({
              message: "User updated successfully",
              user: updatedUserDoc,
            });
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
