import { Router, Request, Response } from "express";
import { generateQuestions, outputSchema } from "../controllers";
import { StatusCodes } from "../config";
import { batchCreateQuestionsAI } from "../controllers";
import { Material } from "../models";
import { authenticateUser, authorizeRoles } from "../middlewares";

const aiRoutes: Router = Router();

aiRoutes.use(authenticateUser);
aiRoutes.use(authorizeRoles("admin"));

aiRoutes.post("/generate", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
      return;
    }

    const { url } = req.body;

    const material = await Material.findOne({ url: url });

    if (!material) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Course not found" });
      return;
    }

    const output = await generateQuestions(url);

    const validatedOutput = outputSchema.parse(output) as any[];

    const questions = await batchCreateQuestionsAI(
      validatedOutput,
      material.courseId.toString()
    );

    res
      .status(StatusCodes.OK)
      .json({ message: "Success", questions: questions });
  } catch (error: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
});

export default aiRoutes;
