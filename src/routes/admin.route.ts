import { Router, Request, Response } from "express";
import { StatusCodes } from "../config";
import {
  updateUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
} from "../controllers";
import { authenticateUser, authorizeRoles } from "../middlewares";

const adminRoutes: Router = Router();

adminRoutes.use(authenticateUser);
adminRoutes.use(authorizeRoles("admin"));

adminRoutes.put("/update", async (req: Request, res: Response) => {
  try {
    const user = req.body;

    if (!user) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Input user details to update" });
      return;
    }

    if (user.email) {
      const userDoc = await findUserByEmail(user.email);

      if (!userDoc) {
        res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
        return;
      }

      const updatedUser = await updateUser(userDoc.id, user);

      res
        .status(StatusCodes.OK)
        .json({ message: "User has been updated", updatedUser });
      return;
    }

    if (user.username) {
      const userDoc = await findUserByUsername(user.username);

      if (!userDoc) {
        res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
        return;
      }

      const updatedUser = await updateUser(userDoc.id, user);

      res
        .status(StatusCodes.OK)
        .json({ message: "User has been updated", updatedUser });

      return;
    }

    if (user.id) {
      const userDoc = await findUserById(user.id);

      if (!userDoc) {
        res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
        return;
      }

      const updatedUser = await updateUser(userDoc.id, user);

      res
        .status(StatusCodes.OK)
        .json({ message: "User has been updated", updatedUser });
      return;
    }

    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Input user email, username or id to update" });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

adminRoutes.post("/create", async (res: Response, req: Request) => {
  try {
    const user = req.body;

    if (!user || !user.email || !user.password) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid request data" });
      return;
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

export default adminRoutes;
