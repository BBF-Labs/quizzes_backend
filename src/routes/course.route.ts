import { Router, Request, Response } from "express";
import { authorizeRoles, authenticateUser } from "../middlewares";
import {
  createCourse,
  getAllCourses,
  getUserCourses,
  updateCourse,
  deleteCourse,
  findCourseByCode,
  findCourseById,
  findUserByUsername,
} from "../controllers";
import { StatusCodes } from "../config";

const courseRoutes: Router = Router();

courseRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const courses = await getAllCourses();

    if (!courses) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Courses not found" });
      return;
    }

    const filteredCourses = courses.filter((course) => !course.isDeleted);

    res.status(StatusCodes.OK).json({ message: "Success", filteredCourses });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

courseRoutes.get("/:courseCode", async (req: Request, res: Response) => {
  try {
    const { courseCode } = req.params;
    const course = await findCourseByCode(courseCode);

    if (!course) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Course not found" });
      return;
    }

    if (course.isDeleted) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Course not found" });
      return;
    }

    res.status(StatusCodes.OK).json({ message: "Success", course });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

courseRoutes.get("/id/:courseId", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const course = await findCourseById(courseId);

    if (!course) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Course not found" });
      return;
    }

    if (course.isDeleted) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Course not found" });
      return;
    }

    res.status(StatusCodes.OK).json({ message: "Success", course });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

courseRoutes.post(
  "/create",
  authenticateUser,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const user = req.session.user;

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const userDoc = await findUserByUsername(user.username);

      if (!userDoc) {
        res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "You cannot perform this action" });
        return;
      }

      if (userDoc.role !== "admin") {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const id = userDoc.id;
      const course = await createCourse(id, req.body);

      res
        .status(StatusCodes.CREATED)
        .json({ message: "Course created", course });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  }
);

courseRoutes.put("/:courseId", async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const course = await findCourseById(courseId);

    if (!course) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Course not found" });
      return;
    }

    if (course.isDeleted) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Course not found" });
      return;
    }

    const updatedCourse = await updateCourse(courseId, req.body);

    res
      .status(StatusCodes.OK)
      .json({ message: "Course updated", updatedCourse });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

export default courseRoutes;
