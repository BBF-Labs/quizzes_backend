import { Router, Request, Response } from "express";
import { createUser } from "../controllers";

const userRoutes: Router = Router();

userRoutes.post("/register", async (req: Request, res: Response) => {
  try {
    const user = req.body;

    if (!user) {
      res.status(400).json({ message: "Invalid request" });
    }

    const newUser = await createUser(user);

    res.status(201).json({ message: "User created", user: newUser });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default userRoutes;
