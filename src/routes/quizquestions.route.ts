import { Router, Request, Response } from "express";
import {
  getQuizQuestions,
  batchCreateQuizQuestions,
  getCourseQuizQuestions,
  updateQuizQuestion,
  getFullQuizInformation,
} from "../controllers";
import { authenticateUser, authorizeRoles } from "../middlewares";
import { StatusCodes } from "../config";

const quizQuestionsRoutes: Router = Router();
quizQuestionsRoutes.use(authenticateUser);

/**
 * @swagger
 * /api/v1/quizzes:
 *   get:
 *     summary: Get all quiz questions
 *     description: Retrieve all available quiz questions
 *     tags:
 *       - Quiz Questions
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 quizzes:
 *                   type: array
 *       404:
 *         description: No quizzes available
 *       500:
 *         description: Internal server error
 */
quizQuestionsRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const questions = await getQuizQuestions();

    if (!questions) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No quizzes currently available" });
      return;
    }

    res.status(StatusCodes.OK).json({ message: "Success", quizzes: questions });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: `Error: ${err.message}` });
  }
});

/**
 * @swagger
 * /api/v1/quizzes/create:
 *   post:
 *     summary: Create quiz questions
 *     description: Create new quiz questions (admin only)
 *     tags:
 *       - Quiz Questions
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *             properties:
 *               questionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Quizzes created successfully
 *       400:
 *         description: Question IDs required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
quizQuestionsRoutes.post(
  "/create",
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.body;

      if (!questionId) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Question Ids are needed to create quiz" });
        return;
      }

      await batchCreateQuizQuestions(questionId);

      res
        .status(StatusCodes.OK)
        .json({ message: "Quizzes have been created successfully" });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/quizzes/update:
 *   put:
 *     summary: Update quiz questions
 *     description: Update existing quiz questions
 *     tags:
 *       - Quiz Questions
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       500:
 *         description: Internal server error
 *
 */
quizQuestionsRoutes.put("/update", async (req: Request, res: Response) => {
  try {
    const quiz = req.body;

    if (!quiz) {
      throw new Error("Quiz fields are required to update");
    }

    const updateQuizDoc = await updateQuizQuestion(quiz);

    res
      .status(StatusCodes.OK)
      .json({ message: "Success", quiz: updateQuizDoc });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/quizzes/course/{courseId}:
 *   get:
 *     summary: Get course quiz questions
 *     description: Get all quiz questions for a specific course
 *     tags:
 *       - Quiz Questions
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No quiz questions found
 *       500:
 *         description: Internal server error
 *
 */
quizQuestionsRoutes.get(
  "/course/:courseId",
  async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const quizQuestions = await getCourseQuizQuestions(courseId);

      if (!quizQuestions) {
        res.status(StatusCodes.NOT_FOUND).json({
          message: "No quiz questions found for this course",
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        message: "Success",
        quizQuestions,
      });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `Error: ${err.message}` });
    }
  }
);

/**
 * @swagger
 * /api/v1/quizzes/full/{courseId}:
 *   get:
 *     summary: Get full quiz information
 *     description: Get complete quiz information for a specific course
 *     tags:
 *       - Quiz Questions
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No full quiz information found
 *       500:
 *         description: Internal server error
 */
quizQuestionsRoutes.get(
  "/full/:courseId",
  async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const fullQuizQuestions = await getFullQuizInformation(courseId);

      if (!fullQuizQuestions) {
        res.status(StatusCodes.NOT_FOUND).json({
          message: "No full quiz information found for this course",
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        message: "Success",
        fullQuizQuestions,
      });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `Error: ${err.message}` });
    }
  }
);

export default quizQuestionsRoutes;
