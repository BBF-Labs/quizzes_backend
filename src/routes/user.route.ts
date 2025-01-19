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

    if (!user) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid request" });
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

userRoutes.get(
  "/profile",
  authenticateUser,
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const user = req.session.user;

      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "User not found" });
        return;
      }

      const userDoc = await findUserByUsername(user.username);

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

      await updateUser(userDoc.id, updates);

      res.status(StatusCodes.OK).json({ message: "User updated successfully" });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error", error: err.message });
    }
  }
);

export default userRoutes;
