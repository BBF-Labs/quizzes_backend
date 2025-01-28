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

// Update quiz questions
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
