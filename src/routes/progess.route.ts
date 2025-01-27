import { Router, Request, Response } from "express";
import { authenticateUser } from "../middlewares";
import {
  createProgress,
  getUserProgress,
  getUserProgressByCourseId,
  updateUserProgress,
} from "../controllers";
import { StatusCodes } from "../config";

const progressRoutes: Router = Router();

progressRoutes.use(authenticateUser);

progressRoutes.get("/user/:courseId", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const user = req.session.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User not authenticated" });
      return;
    }

    const progress = await getUserProgressByCourseId(user.username, courseId);

    if (!progress) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Progress not found" });
      return;
    }

    res.status(StatusCodes.OK).json(progress);
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch course progress",
      details: err.message,
    });
  }
});

progressRoutes.get("/user", async (req: Request, res: Response) => {
  try {
    const user = req.session.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User not authenticated" });
      return;
    }

    const progress = await getUserProgress(user.username);
    res.status(StatusCodes.OK).json(progress);
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch user progress",
      details: err.message,
    });
  }
});

progressRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.session.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Login to access this route" });
      return;
    }
    const progress = req.body;

    const newProgress = await createProgress(user.username, progress);

    res.status(StatusCodes.CREATED).json(newProgress);
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to create progress",
      details: err.message,
    });
  }
});

progressRoutes.put("/:courseId", async (req: Request, res: Response) => {
  try {
    const user = req.session.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Login to access this route" });
      return;
    }
    const progress = req.body;

    const updatedProgress = await updateUserProgress(user.username, progress);

    if (!updatedProgress) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Progress not found" });
      return;
    }

    res.status(StatusCodes.OK).json(updatedProgress);
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to update progress",
      details: err.message,
    });
  }
});

export default progressRoutes;
