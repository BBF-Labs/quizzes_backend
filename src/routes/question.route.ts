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
} from "../controllers";

import { authenticateUser, authorizeRoles } from "../middlewares";
import { StatusCodes } from "../config";

const questionRoutes: Router = Router();

questionRoutes.use(authenticateUser);

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

questionRoutes.post("/update", async (req: Request, res: Response) => {
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
});

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

questionRoutes.post(
  "/moderate",
  authorizeRoles("admin", "moderator"),
  async (req: Request, res: Response) => {
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

      if (questionId.length > 1) {
        const questions = await batchModerateQuestions(questionId, moderator);

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

      await batchCreateQuizQuestions([questionId]);

      res
        .status(StatusCodes.OK)
        .json({ message: "Success", question: question });
    } catch (error: any) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
  }
);

questionRoutes.post("/create", async (req: Request, res: Response) => {
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
});

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
