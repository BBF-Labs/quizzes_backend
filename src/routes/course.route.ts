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

// Normalize Express params/query values that may be string | string[] | ParsedQs
const asString = (val: unknown): string | undefined => {
  if (Array.isArray(val)) return asString(val[0]);
  return typeof val === "string" ? val : undefined;
};

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Get all courses
 *     description: Retrieve all available courses
 *     tags:
 *       - Courses
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
 *                 courses:
 *                   type: array
 *       404:
 *         description: Courses not found
 *       500:
 *         description: Internal server error
 */
courseRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const pageStr = asString(req.query.page);
    const limitStr = asString(req.query.limit);
    const paginatedResult = await getAllCourses({
      page: (pageStr ? parseInt(pageStr) : 1) || 1,
      limit: (limitStr ? parseInt(limitStr) : 10) || 10,
    });

    if (!paginatedResult.data) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Courses not found" });
      return;
    }

    res.status(StatusCodes.OK).json({ message: "Success", ...paginatedResult });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/courses/code/{courseCode}:
 *   get:
 *     summary: Get course by code
 *     description: Retrieve a specific course using its course code
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
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
 *                 course:
 *                   type: object
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 *
 */
courseRoutes.get("/code/:courseCode", async (req: Request, res: Response) => {
  try {
    const courseCode = asString(req.params.courseCode);
    if (!courseCode) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Course code is required" });
      return;
    }
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

/**
 * @swagger
 * /api/v1/courses/id/{courseId}:
 *   get:
 *     summary: Get course by ID
 *     description: Retrieve a specific course using its ID
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
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
 *                 course:
 *                   type: object
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
courseRoutes.get("/id/:courseId", async (req: Request, res: Response) => {
  try {
    const rawCourseId = asString(req.params.courseId);
    if (!rawCourseId) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Course ID is required" });
      return;
    }
    const course = await findCourseById(rawCourseId.trim());

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

/**
 * @swagger
 * /api/v1/courses/create:
 *   post:
 *     summary: Create new course
 *     description: Create a new course (admin only)
 *     tags:
 *       - Courses
 *     security:
 *      - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - about
 *     responses:
 *       201:
 *         description: Course created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
courseRoutes.post(
  "/create",
  authenticateUser,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;

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
  },
);

/**
 * @swagger
 * /api/v1/courses/update/{courseId}:
 *   put:
 *     summary: Update course
 *     description: Update an existing course (admin only)
 *     tags:
 *       - Courses
 *     security:
 *      - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Cannot delete course on this route
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
courseRoutes.put(
  "/update/:courseId",
  authenticateUser,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const courseId = asString(req.params.courseId);
      if (!courseId) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Course ID is required" });
        return;
      }
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
        .json({ message: "Course updated", course: updatedCourse });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/courses/delete/{courseId}:
 *   delete:
 *     summary: Delete course
 *     description: Delete an existing course (admin only)
 *     tags:
 *       - Courses
 *     security:
 *      - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
courseRoutes.delete(
  "/delete/:courseId",
  authenticateUser,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const courseId = asString(req.params.courseId);
      if (!courseId) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Course ID is required" });
        return;
      }
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
        .json({ message: "Course deleted", course: deletedCourse });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  },
);

export default courseRoutes;

//implement get user courses
