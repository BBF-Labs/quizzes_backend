import { Router, Request, Response } from "express";
import { StatusCodes } from "../config";
import {
  generatePersonalQuiz,
  getUserPersonalQuizzes,
  getPersonalQuizById,
  updatePersonalQuiz,
  sharePersonalQuiz,
  getSharedQuizByToken,
  deletePersonalQuiz,
} from "../controllers/personalQuiz.controller";
import { findUserByUsername } from "../controllers/user.controller";
import { authenticateUser } from "../middlewares/auth.middleware";

const personalQuizRoutes = Router();

// Apply authentication middleware to all routes
personalQuizRoutes.use(authenticateUser);

/**
 * @swagger
 * /api/v1/personal-quizzes/generate:
 *   post:
 *     summary: Generate a personal quiz from user's materials
 *     description: Generate a personal quiz from user's uploaded materials using AI
 *     tags:
 *       - Personal Quizzes
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - courseId
 *               - materialIds
 *               - questionCount
 *               - difficulty
 *               - estimatedDuration
 *               - tags
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the quiz
 *               description:
 *                 type: string
 *                 description: Description of the quiz
 *               courseId:
 *                 type: string
 *                 description: ID of the course
 *               materialIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of material IDs to generate questions from
 *               questionCount:
 *                 type: number
 *                 description: Number of questions to generate
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Difficulty level of the quiz
 *               estimatedDuration:
 *                 type: number
 *                 description: Estimated duration in minutes
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags for the quiz
 *     responses:
 *       201:
 *         description: Personal quiz generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied to materials
 *       500:
 *         description: Internal server error
 */
personalQuizRoutes.post("/generate", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const {
      title,
      description,
      courseId,
      materialIds,
      questionCount,
      difficulty,
      estimatedDuration,
      tags,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !courseId ||
      !materialIds ||
      !questionCount ||
      !difficulty ||
      !estimatedDuration ||
      !tags
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Missing required fields",
      });
    }

    const userDoc = await findUserByUsername(user.username);
    if (!userDoc) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const quiz = await generatePersonalQuiz(
      userDoc._id.toString(),
      materialIds,
      {
        title,
        description,
        courseId,
        questionCount,
        difficulty,
        estimatedDuration,
        tags,
      }
    );

    res.status(StatusCodes.CREATED).json({
      message: "Personal quiz generated successfully",
      quiz,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to generate personal quiz",
    });
  }
});

/**
 * @swagger
 * /api/v1/personal-quizzes:
 *   get:
 *     summary: Get user's personal quizzes
 *     description: Retrieve personal quizzes created by the authenticated user
 *     tags:
 *       - Personal Quizzes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *     responses:
 *       200:
 *         description: Personal quizzes retrieved successfully
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
personalQuizRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { courseId } = req.query;

    const quizzes = await getUserPersonalQuizzes(
      user.username,
      courseId as string
    );

    res.status(StatusCodes.OK).json({
      message: "Personal quizzes retrieved successfully",
      quizzes,
      count: quizzes.length,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to retrieve personal quizzes",
    });
  }
});

/**
 * @swagger
 * /api/v1/personal-quizzes/{id}:
 *   get:
 *     summary: Get personal quiz by ID
 *     description: Retrieve a specific personal quiz with full details
 *     tags:
 *       - Personal Quizzes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Personal quiz retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
personalQuizRoutes.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const quiz = await getPersonalQuizById(user.username, id);

    if (!quiz) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Quiz not found",
      });
    }

    res.status(StatusCodes.OK).json({
      message: "Personal quiz retrieved successfully",
      quiz,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to retrieve personal quiz",
    });
  }
});

/**
 * @swagger
 * /api/v1/personal-quizzes/{id}:
 *   put:
 *     summary: Update personal quiz
 *     description: Update personal quiz details and settings
 *     tags:
 *       - Personal Quizzes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated title
 *               description:
 *                 type: string
 *                 description: Updated description
 *               settings:
 *                 type: object
 *                 description: Updated quiz settings
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated tags
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Updated difficulty
 *     responses:
 *       200:
 *         description: Personal quiz updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
personalQuizRoutes.put("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updateData = req.body;

    const updatedQuiz = await updatePersonalQuiz(user.username, id, updateData);

    res.status(StatusCodes.OK).json({
      message: "Personal quiz updated successfully",
      quiz: updatedQuiz,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to update personal quiz",
    });
  }
});

/**
 * @swagger
 * /api/v1/personal-quizzes/{id}/share:
 *   post:
 *     summary: Share personal quiz
 *     description: Make personal quiz public and generate share URL
 *     tags:
 *       - Personal Quizzes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Personal quiz shared successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
personalQuizRoutes.post("/:id/share", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const { shareUrl } = await sharePersonalQuiz(user.username, id);

    res.status(StatusCodes.OK).json({
      message: "Personal quiz shared successfully",
      shareUrl,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to share personal quiz",
    });
  }
});

/**
 * @swagger
 * /api/v1/personal-quizzes/{id}:
 *   delete:
 *     summary: Delete personal quiz
 *     description: Delete a personal quiz created by the user
 *     tags:
 *       - Personal Quizzes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Personal quiz deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
personalQuizRoutes.delete("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    await deletePersonalQuiz(user.username, id);

    res.status(StatusCodes.OK).json({
      message: "Personal quiz deleted successfully",
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to delete personal quiz",
    });
  }
});

/**
 * @swagger
 * /api/v1/personal-quizzes/shared/{token}:
 *   get:
 *     summary: Get shared quiz by token
 *     description: Retrieve a public shared quiz using the share token no authentication required
 *     tags:
 *       - Personal Quizzes
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Share token
 *     responses:
 *       200:
 *         description: Shared quiz retrieved successfully
 *       404:
 *         description: Quiz not found or not public
 *       500:
 *         description: Internal server error
 */
personalQuizRoutes.get(
  "/shared/:token",
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      const quiz = await getSharedQuizByToken(token);

      if (!quiz) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: "Quiz not found or not public",
        });
      }

      res.status(StatusCodes.OK).json({
        message: "Shared quiz retrieved successfully",
        quiz,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || "Failed to retrieve shared quiz",
      });
    }
  }
);

export default personalQuizRoutes;
