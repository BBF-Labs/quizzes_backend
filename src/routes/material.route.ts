import { Router, Request, Response } from "express";
import multer from "multer";
import {
  uploadMaterial,
  getMaterials,
  getUserMaterials,
  getCourseMaterials,
  createLinkMaterial,
} from "../controllers";
import { StatusCodes } from "../config";
import { authenticateUser } from "../middlewares";

const materialRoutes: Router = Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/json",
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

/**
 * @swagger
 * /api/v1/materials/upload:
 *   post:
 *     summary: Upload course material
 *     description: Upload a new course material file
 *     tags:
 *       - Materials
 *     security:
 *      - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - courseId
 *               - questionRefType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Material file (max 10MB)
 *               courseId:
 *                 type: string
 *                 description: ID of the course
 *               questionRefType:
 *                 type: string
 *                 description: Type of material [lecture Number, IA, or Quiz]
 *     responses:
 *       201:
 *         description: Material uploaded successfully
 *       400:
 *         description: Invalid file or missing course ID
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
materialRoutes.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          message: "User not found",
        });
        return;
      }
      const { courseId, questionRefType } = req.body;

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

      if (!questionRefType) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Type of material is required [lecture Number, IA, or Quiz]",
        });
        return;
      }

      const material = await uploadMaterial(
        file,
        courseId,
        user.username,
        questionRefType
      );

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

/**
 * @swagger
 * /api/v1/materials/li/upload:
 *   post:
 *     summary: Upload course material
 *     description: Upload a new course material file
 *     tags:
 *       - Materials
 *     security:
 *      - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - link
 *               - questionRefType
 *               - courseId
 *             properties:
 *               link:
 *                 type: string
 *                 description: Link to resource
 *               courseId:
 *                 type: string
 *                 description: ID of the course
 *               questionRefType:
 *                 type: string
 *                 description: Type of material [lecture Number, IA, or Quiz]
 *     responses:
 *       201:
 *         description: Material uploaded successfully
 *       400:
 *         description: Invalid Link or missing course ID
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
materialRoutes.post("/li/upload", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: "User not found",
      });
      return;
    }
    const { courseId, ...data } = req.body;

    if (!data.questionRefType) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Type of material is required [lecture Number, IA, or Quiz]",
      });
      return;
    }

    if (!courseId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Course ID is required",
      });
      return;
    }

    const material = await createLinkMaterial(user.username, courseId, data);

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
});

/**
 * @swagger
 * /api/v1/materials:
 *   get:
 *     summary: Get all materials
 *     description: Retrieve all course materials
 *     tags:
 *       - Materials
 *     security:
 *      - BearerAuth: []
 *     responses:
 *       200:
 *         description: Materials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 materials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                       courseId:
 *                         type: string
 *                       uploadedBy:
 *                         type: string
 *                       url:
 *                         type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/materials/user:
 *   get:
 *     summary: Get user materials
 *     description: Retrieve all materials uploaded by the authenticated user
 *     tags:
 *       - Materials
 *     security:
 *      - BearerAuth: []
 *     responses:
 *       200:
 *         description: User materials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 materials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         description: Name of the uploaded file
 *                       courseId:
 *                         type: string
 *                         description: ID of the course the material belongs to
 *                       uploadedBy:
 *                         type: string
 *                         description: Username of the user who uploaded the material
 *                       url:
 *                         type: string
 *                         description: URL to access the material
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
materialRoutes.get("/user", async (req: Request, res: Response) => {
  try {
    const user = req.user;

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

/**
 * @swagger
 * /api/v1/materials/course/{courseId}:
 *   get:
 *     summary: Get course materials
 *     description: Retrieve all materials for a specific course
 *     tags:
 *       - Materials
 *     security:
 *      - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to get materials for
 *     responses:
 *       200:
 *         description: Course materials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 materials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         description: Name of the uploaded file
 *                       courseId:
 *                         type: string
 *                         description: ID of the course the material belongs to
 *                       uploadedBy:
 *                         type: string
 *                         description: Username of the user who uploaded the material
 *                       url:
 *                         type: string
 *                         description: URL to access the material
 *       400:
 *         description: Course ID is required
 *       500:
 *         description: Internal server error
 */
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
