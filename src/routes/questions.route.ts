import { Router, Request, Response } from "express";
import { getQuizQuestions, getCourseQuizQuestions } from "../controllers";
import { authenticateUser } from "../middlewares";
import { StatusCodes } from "../config";

const questionsRoutes: Router = Router();
questionsRoutes.use(authenticateUser);

questionsRoutes.get("/", async (req: Request, res: Response) => {
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

export default questionsRoutes;
