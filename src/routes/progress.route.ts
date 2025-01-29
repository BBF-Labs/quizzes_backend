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
    const user = req.user;

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

    res
      .status(StatusCodes.OK)
      .json({ message: "Course progress fetched", progress });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch course progress",
      details: err.message,
    });
  }
});

progressRoutes.get("/user", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User not authenticated" });
      return;
    }

    const progress = await getUserProgress(user.username);
    res
      .status(StatusCodes.OK)
      .json({ message: "User progress fetched", progress });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch user progress",
      details: err.message,
    });
  }
});

progressRoutes.post("/create", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Login to access this route" });
      return;
    }
    const progress = req.body;

    const newProgress = await createProgress(user.username, progress);

    res
      .status(StatusCodes.CREATED)
      .json({ message: "Progress created", progress: newProgress });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to create progress",
      details: err.message,
    });
  }
});

progressRoutes.put("/:progressId", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Login to access this route" });
      return;
    }
    const progressId = req.params.progressId;

    const progress = req.body;

    if (!progressId) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Progress ID required" });
      return;
    }

    if (!progress) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Progress data required" });
      return;
    }

    const updatedProgress = await updateUserProgress(progressId, progress);

    if (!updatedProgress) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Progress not found" });
      return;
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Progress updated", progress: updatedProgress });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to update progress",
      details: err.message,
    });
  }
});

export default progressRoutes;
