import { Router, Response, Request } from "express";
import {
  createQuestion,
  getQuestionById,
  updateQuestion,
  getCourseQuestions,
  getUncheckedQuestions,
  getQuestionByCourseCode,
  batchCreateQuestions,
  batchModerateQuestions,
  batchCreateQuizQuestions,
  approveAllByModerator,
  updateUser,
  findUserByUsername,
} from "../controllers";

import { authenticateUser, authorizeRoles } from "../middlewares";
import { StatusCodes } from "../config";

const questionRoutes: Router = Router();

questionRoutes.use(authenticateUser);

/**
 * @swagger
 * /api/v1/question/id/c/{courseId}:
 *   get:
 *     summary: Get all questions for a course
 *     description: Retrieve all questions for a specific course, including moderation count.
 *     tags:
 *       - Questions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *     responses:
 *       200:
 *         description: Successfully retrieved questions
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
questionRoutes.get("/id/c/:courseId", async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId;

    const user = req.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "You are not authorized to use this route" });
      return;
    }

    if (!courseId) {
      throw new Error("Course ID is required");
    }

    const questions = await getCourseQuestions(courseId);

    const moderationCount = questions.filter(
      (question) => question.isModerated == false
    ).length;

    const questionDoc = questions.filter(
      (question) => question.isModerated == true
    );

    res.status(StatusCodes.OK).json({
      message: "Success",
      question: questionDoc,
      moderation: moderationCount,
    });
  } catch (err: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/question/id/{questionId}:
 *   get:
 *     summary: Get a question by ID
 *     description: Retrieve a specific question by its ID.
 *     tags:
 *       - Questions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the question
 *     responses:
 *       200:
 *         description: Successfully retrieved question
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
questionRoutes.get("/id/:questionId", async (req: Request, res: Response) => {
  try {
    const questionId = req.params.questionId;

    if (!questionId) {
      throw new Error("Question ID is required");
    }

    const question = await getQuestionById(questionId);

    res.status(StatusCodes.OK).json({ message: "Success", question: question });
  } catch (err: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/question/update:
 *   post:
 *     summary: Update a question
 *     description: Modify an existing question.
 *     tags:
 *       - Questions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - question
 *             properties:
 *               questionId:
 *                 type: string
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated question
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
questionRoutes.post(
  "/update",
  authorizeRoles("admin", "moderator"),
  async (req: Request, res: Response) => {
    try {
      const { questionId, question } = req.body;

      if (!questionId || !question) {
        throw new Error("Question details are required");
      }

      const questionDoc = await updateQuestion(questionId, question);

      res
        .status(StatusCodes.OK)
        .json({ message: "Success", question: questionDoc });
    } catch (err: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/question/unchecked/{courseId}:
 *   get:
 *     summary: Get unchecked questions for a course
 *     description: Retrieve all unchecked questions for a specific course.
 *     tags:
 *       - Questions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *     responses:
 *       200:
 *         description: Successfully retrieved unchecked questions
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
questionRoutes.get(
  "/unchecked/:courseId",
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.courseId;

      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const questions = await getUncheckedQuestions(courseId);

      res
        .status(StatusCodes.OK)
        .json({ message: "Success", question: questions });
    } catch (err: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/question/course/{courseCode}:
 *   get:
 *     summary: Get questions by course code
 *     description: Retrieve questions using a course code, along with moderation count.
 *     tags:
 *       - Questions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Course code
 *     responses:
 *       200:
 *         description: Successfully retrieved questions
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
questionRoutes.get(
  "/course/:courseCode",
  async (req: Request, res: Response) => {
    try {
      const courseCode = req.params.courseCode;

      if (!courseCode) {
        throw new Error("Course Code is required");
      }

      const questions = await getQuestionByCourseCode(courseCode);

      const moderationCount = questions.filter(
        (question) => question.isModerated == false
      ).length;

      const questionDoc = questions.filter(
        (question) => question.isModerated == true
      );

      res.status(StatusCodes.OK).json({
        message: "Success",
        question: questionDoc,
        moderation: moderationCount,
      });
    } catch (err: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/question/moderate:
 *   post:
 *     summary: Moderate questions
 *     description: Approve one or multiple questions
 *     tags:
 *       - Questions
 *     security:
 *      - BearerAuth: []
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
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Question(s) moderated successfully
 *       400:
 *         description: Invalid question ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to moderate
 *       500:
 *         description: Internal server error
 */
questionRoutes.post("/moderate", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Login to access this route" });
      return;
    }

    const moderator = user.username;

    const { questionId } = req.body;

    if (!questionId) {
      throw new Error("Question ID is required");
    }

    const userDoc = await findUserByUsername(moderator);

    if (!userDoc) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "You are not authorized to make this request" });
      return;
    }

    if (questionId.length > 1) {
      const questions = await batchModerateQuestions(questionId, moderator);
      if (userDoc.role !== "moderator") {
        await updateUser(userDoc._id.toString(), { role: "moderator" });
      }

      await batchCreateQuizQuestions(questionId);

      res.status(StatusCodes.OK).json({
        message: "Success",
        stats: {
          approvedQuestions: questions.modifiedCount,
          matchedQuestions: questions.matchedCount,
        },
      });
      return;
    }

    const question = await updateQuestion(questionId, { isModerated: true });

    if (userDoc.role !== "moderator") {
      await updateUser(userDoc._id.toString(), { role: "moderator" });
    }

    await batchCreateQuizQuestions([questionId]);

    res.status(StatusCodes.OK).json({ message: "Success", question: question });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/question/create:
 *   post:
 *     summary: Create new question(s)
 *     description: Create one or multiple course questions
 *     tags:
 *       - Questions
 *     security:
 *      - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 oneOf:
 *                   - type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                       answer:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [mcq]
 *                       courseId:
 *                         type: string
 *                       lectureNumber:
 *                         type: integer
 *                   - type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         question:
 *                           type: string
 *                         options:
 *                           type: array
 *                           items:
 *                             type: string
 *                         answer:
 *                           type: string
 *                         type:
 *                           type: string
 *                           enum: [mcq]
 *                         courseId:
 *                           type: string
 *                         lectureNumber:
 *                           type: integer
 *     responses:
 *       200:
 *         description: Question(s) created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
questionRoutes.post(
  "/create",
  authorizeRoles("admin", "moderator", "student"),
  async (req: Request, res: Response) => {
    try {
      const { question } = req.body;

      if (!question) {
        throw new Error("Question fields are required");
      }

      const courseId = question.courseId;

      const author = req.user?.username;

      if (!author) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "You are not authorized to make this request" });
        return;
      }

      if (Array.isArray(req.body.question)) {
        const questionDoc = await batchCreateQuestions(
          question,
          author,
          courseId
        );

        res
          .status(StatusCodes.OK)
          .json({ message: "Success", question: questionDoc });
        return;
      }

      const newQuestion = await createQuestion(question, author, courseId);

      res
        .status(StatusCodes.OK)
        .json({ message: "Success", question: newQuestion });
    } catch (err: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/question/moderate/all/{courseId}:
 *   post:
 *     summary: Moderate all course questions
 *     description: Approve all questions belonging to a course
 *     tags:
 *       - Questions
 *     security:
 *      - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to moderate questions for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 oneOf:
 *                   - type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                         description: The question text
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Array of possible answer options
 *                       answer:
 *                         type: string
 *                         description: The correct answer
 *                       type:
 *                         type: string
 *                         enum: [mcq]
 *                         description: Type of question (multiple choice)
 *                       courseId:
 *                         type: string
 *                         description: ID of the course this question belongs to
 *                       lectureNumber:
 *                         type: integer
 *                         description: Lecture number this question belongs to
 *                   - type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         question:
 *                           type: string
 *                           description: The question text
 *                         options:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Array of possible answer options
 *                         answer:
 *                           type: string
 *                           description: The correct answer
 *                         type:
 *                           type: string
 *                           enum: [mcq]
 *                           description: Type of question (multiple choice)
 *                         courseId:
 *                           type: string
 *                           description: ID of the course this question belongs to
 *                         lectureNumber:
 *                           type: integer
 *                           description: Lecture number this question belongs to
 *     responses:
 *       200:
 *         description: Question(s) created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Questions moderated successfully"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
questionRoutes.post(
  "/moderate/all/:courseId",
  authorizeRoles("admin", "moderator"),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Login to access this route" });
        return;
      }

      const moderator = req.body.moderator || user.username;
      const { courseId } = req.params;

      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const approvalResult = await approveAllByModerator(courseId, moderator);

      const questionDocs = await getCourseQuestions(courseId);

      const questionIds = questionDocs
        .filter((q) => q.isModerated)
        .map((q) => q._id.toString());

      await batchCreateQuizQuestions(questionIds);

      res.status(StatusCodes.OK).json({
        message: "Success",
        approvedQuestions: approvalResult.modifiedCount,
      });
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
);

export default questionRoutes;
