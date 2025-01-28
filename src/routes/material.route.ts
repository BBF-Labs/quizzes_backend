import { Router, Request, Response } from "express";
import multer from "multer";
import {
  uploadMaterial,
  getMaterials,
  getUserMaterials,
  getCourseMaterials,
} from "../controllers";
import { StatusCodes } from "../config";
import { authenticateUser } from "../middlewares";

const materialRoutes: Router = Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("Invalid file type"));
      return;
    }

    cb(null, true);
  },
});

materialRoutes.use(authenticateUser);

materialRoutes.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const user = req.session.user;

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "User not found",
        });
        return;
      }
      const { courseId } = req.body;

      const file = req.file;

      if (!file) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "No file uploaded",
        });
        return;
      }

      if (!courseId) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Course ID is required",
        });
        return;
      }

      const material = await uploadMaterial(file, courseId, user.username);

      res.status(StatusCodes.CREATED).json({
        message: "Material uploaded successfully",
        material,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message:
          error instanceof Error ? error.message : "Error uploading material",
      });
    }
  }
);

materialRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const materials = await getMaterials();

    res.status(StatusCodes.OK).json({
      materials,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching materials",
    });
  }
});

materialRoutes.get("/user", async (req: Request, res: Response) => {
  try {
    const user = req.session.user;

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: "User not found",
      });
      return;
    }

    const materials = await getUserMaterials(user.username);

    res.status(StatusCodes.OK).json({
      materials,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message:
        error instanceof Error
          ? error.message
          : "Error fetching user materials",
    });
  }
});

materialRoutes.get("/course/:courseId", async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId;

    if (!courseId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Course ID is required",
      });
      return;
    }

    const materials = await getCourseMaterials(courseId);

    res.status(StatusCodes.OK).json({
      materials,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message:
        error instanceof Error
          ? error.message
          : "Error fetching course materials",
    });
  }
});

export default materialRoutes;
