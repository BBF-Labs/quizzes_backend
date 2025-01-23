import { Router, Response, Request } from "express";
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  getCourseQuestions,
  getUncheckedQuestions,
  getQuestionByCourseCode,
  batchCreateQuestions,
  batchModerateQuestions,
} from "../controllers";

import { authenticateUser, authorizeRoles } from "../middlewares";

const questionRoutes: Router = Router();

questionRoutes.get(
  "/id/c/:courseId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.courseId;

      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const questions = await getCourseQuestions(courseId);

      res.status(200).json({ message: "Success", questions });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);

questionRoutes.get(
  "/id/:questionId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const questionId = req.params.questionId;

      if (!questionId) {
        throw new Error("Question ID is required");
      }

      const question = await getQuestionById(questionId);

      res.status(200).json({ message: "Success", question });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);

questionRoutes.get(
  "/:courseId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.courseId;

      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const questions = await getQuestions(courseId);

      res.status(200).json({ message: "Success", questions });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);

questionRoutes.get(
  "/unchecked/:courseId",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.courseId;

      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const questions = await getUncheckedQuestions(courseId);

      res.status(200).json({ message: "Success", questions });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);

questionRoutes.get(
  "/course/:courseCode",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const courseCode = req.params.courseCode;

      if (!courseCode) {
        throw new Error("Course Code is required");
      }

      const questions = await getQuestionByCourseCode(courseCode);

      res.status(200).json({ message: "Success", questions });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);

questionRoutes.post(
  "/moderate",
  authenticateUser,
  authorizeRoles("admin", "moderator"),
  async (req: Request, res: Response) => {
    try {
      const { questionId } = req.body;

      if (!questionId) {
        throw new Error("Question ID is required");
      }

      if (questionId.length > 1) {
        const questions = await batchModerateQuestions(questionId);
        res.status(200).json({ message: "Success", questions });
        return;
      }

      const question = await updateQuestion(questionId, { isModerated: true });

      res.status(200).json({ message: "Success", question });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

questionRoutes.post(
  "/create",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { question, courseId } = req.body;

      if (!question || !courseId) {
        throw new Error("Question and Course ID are required");
      }

      if (question.length > 1) {
        const questions = await batchCreateQuestions(question, courseId);
        res.status(200).json({ message: "Success", questions });
        return;
      }

      const newQuestion = await createQuestion(question, courseId);

      res.status(200).json({ message: "Success", newQuestion });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);

export default questionRoutes;
