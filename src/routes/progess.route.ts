import { Router, Request, Response } from "express";

const progressRoutes: Router = Router();

progressRoutes.get(
  "/user/:courseId",
  async (req: Request, res: Response) => {}
);
