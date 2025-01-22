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

    res.status(StatusCodes.OK).json({ message: "Success", courses: courses });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

courseRoutes.get("/code/:courseCode", async (req: Request, res: Response) => {
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

    const course = await findCourseById(courseId.trim());

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

      const id = userDoc._id.toString();

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

courseRoutes.put("/update/:courseId", async (req: Request, res: Response) => {
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

    if (req.body.isDeleted) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Cannot delete course on this route" });
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

courseRoutes.delete(
  "/delete/:courseId",
  authenticateUser,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
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

      const deletedCourse = await deleteCourse(courseId);

      res
        .status(StatusCodes.OK)
        .json({ message: "Course deleted", deletedCourse });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  }
);

export default courseRoutes;
