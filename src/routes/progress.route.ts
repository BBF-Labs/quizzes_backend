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

/**
 * @swagger
 * /api/v1/progress/user/{courseId}:
 *   get:
 *     summary: Get user progress by course ID
 *     description: Retrieve progress details for the authenticated user in a specific course
 *     tags:
 *       - Progress
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course
 *     responses:
 *       200:
 *         description: Course progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress:
 *                   type: object
 *                   properties:
 *                     courseCode:
 *                       type: string
 *                     score:
 *                       type: array
 *                       items:
 *                         type: number
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Progress not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/progress/user:
 *   get:
 *     summary: Get user progress
 *     description: Retrieve all progress records for the authenticated user
 *     tags:
 *       - Progress
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseCode:
 *                         type: string
 *                       score:
 *                         type: array
 *                         items:
 *                           type: number
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/progress/create:
 *   post:
 *     summary: Create progress record
 *     description: Create a new progress record for a user
 *     tags:
 *       - Progress
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *               - courseCode
 *               - quizId
 *             properties:
 *               score:
 *                 type: array
 *                 items:
 *                   type: number
 *               courseCode:
 *                 type: string
 *               quizId:
 *                 type: string
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Progress created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */

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

/**
 * @swagger
 * /api/v1/progress/{progressId}:
 *   put:
 *     summary: Update progress
 *     description: Update a user's progress record
 *     tags:
 *       - Progress
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: array
 *                 items:
 *                   type: number
 *               courseCode:
 *                 type: string
 *               quizId:
 *                 type: string
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Progress not found
 *       500:
 *         description: Internal server error
 */
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
