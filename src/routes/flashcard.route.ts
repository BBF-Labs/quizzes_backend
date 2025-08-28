import { Router, Request, Response } from "express";
import { StatusCodes } from "../config";
import {
  generateFlashcards,
  getUserFlashcards,
  updateFlashcard,
  shareFlashcard,
  getSharedFlashcard,
  deleteFlashcard,
  getUserFlashcardStats,
  getUserFlashcardsByCourse,
} from "../controllers/flashcard.controller";
import { findUserByUsername } from "../controllers/user.controller";
import { authenticateUser } from "../middlewares/auth.middleware";

const flashcardRoutes = Router();

// Apply authentication middleware to all routes
flashcardRoutes.use(authenticateUser);

/**
 * @swagger
 * /api/v1/flashcards/generate:
 *   post:
 *     summary: Generate flashcards from user's material
 *     description: Generate flashcards from user's uploaded material using AI
 *     tags:
 *       - Flashcards
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - materialId
 *             properties:
 *               materialId:
 *                 type: string
 *                 description: ID of the material to generate flashcards from
 *               count:
 *                 type: number
 *                 description: Number of flashcards to generate (default 10)
 *     responses:
 *       201:
 *         description: Flashcards generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied to material
 *       500:
 *         description: Internal server error
 */
flashcardRoutes.post("/generate", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { materialId, count = 10 } = req.body;

    if (!materialId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Material ID is required" });
    }

    const userDoc = await findUserByUsername(user.username);
    if (!userDoc) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const flashcards = await generateFlashcards(
      userDoc._id.toString(),
      materialId,
      count
    );

    res.status(StatusCodes.CREATED).json({
      message: "Flashcards generated successfully",
      flashcards,
      count: flashcards.length,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to generate flashcards",
    });
  }
});

/**
 * @swagger
 * /api/v1/flashcards:
 *   get:
 *     summary: Get user's flashcards
 *     description: Retrieve flashcards created by the authenticated user
 *     tags:
 *       - Flashcards
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: materialId
 *         schema:
 *           type: string
 *         description: Filter by material ID
 *     responses:
 *       200:
 *         description: Flashcards retrieved successfully
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
flashcardRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { courseId, materialId } = req.query;

    const flashcards = await getUserFlashcards(
      user.username,
      courseId as string,
      materialId as string
    );

    res.status(StatusCodes.OK).json({
      message: "Flashcards retrieved successfully",
      flashcards,
      count: flashcards.length,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to retrieve flashcards",
    });
  }
});

/**
 * @swagger
 * /api/v1/flashcards/{id}:
 *   put:
 *     summary: Update flashcard
 *     description: Update flashcard details eg mastery level review count
 *     tags:
 *       - Flashcards
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Flashcard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               masteryLevel:
 *                 type: number
 *                 description: New mastery level 0-100
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated tags
 *     responses:
 *       200:
 *         description: Flashcard updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Flashcard not found
 *       500:
 *         description: Internal server error
 */
flashcardRoutes.put("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const updateData = req.body;

    const updatedFlashcard = await updateFlashcard(
      user.username,
      id,
      updateData
    );

    res.status(StatusCodes.OK).json({
      message: "Flashcard updated successfully",
      flashcard: updatedFlashcard,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to update flashcard",
    });
  }
});

/**
 * @swagger
 * /api/v1/flashcards/{id}/share:
 *   post:
 *     summary: Share flashcard
 *     description: Make flashcard public and generate share URL
 *     tags:
 *       - Flashcards
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Flashcard ID
 *     responses:
 *       200:
 *         description: Flashcard shared successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Flashcard not found
 *       500:
 *         description: Internal server error
 */
flashcardRoutes.post("/:id/share", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const { shareUrl } = await shareFlashcard(user.username, id);

    res.status(StatusCodes.OK).json({
      message: "Flashcard shared successfully",
      shareUrl,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to share flashcard",
    });
  }
});

/**
 * @swagger
 * /api/v1/flashcards/{id}:
 *   delete:
 *     summary: Delete flashcard
 *     description: Delete a flashcard created by the user
 *     tags:
 *       - Flashcards
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Flashcard ID
 *     responses:
 *       200:
 *         description: Flashcard deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Flashcard not found
 *       500:
 *         description: Internal server error
 */
flashcardRoutes.delete("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    await deleteFlashcard(user.username, id);

    res.status(StatusCodes.OK).json({
      message: "Flashcard deleted successfully",
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to delete flashcard",
    });
  }
});

/**
 * @swagger
 * /api/v1/flashcards/shared/{id}:
 *   get:
 *     summary: Get shared flashcard
 *     description: Retrieve a public shared flashcard no authentication required
 *     tags:
 *       - Flashcards
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Flashcard ID
 *     responses:
 *       200:
 *         description: Shared flashcard retrieved successfully
 *       404:
 *         description: Flashcard not found or not public
 *       500:
 *         description: Internal server error
 */
flashcardRoutes.get("/shared/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const flashcard = await getSharedFlashcard(id);

    if (!flashcard) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Flashcard not found or not public",
      });
    }

    res.status(StatusCodes.OK).json({
      message: "Shared flashcard retrieved successfully",
      flashcard,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to retrieve shared flashcard",
    });
  }
});

/**
 * @swagger
 * /api/v1/flashcards/stats:
 *   get:
 *     summary: Get user's flashcard statistics
 *     description: Retrieve comprehensive statistics about user's flashcards
 *     tags:
 *       - Flashcards
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Flashcard statistics retrieved successfully
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
flashcardRoutes.get("/stats", async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    const stats = await getUserFlashcardStats(user.username);

    res.status(StatusCodes.OK).json({
      message: "Flashcard statistics retrieved successfully",
      stats,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Failed to retrieve flashcard statistics",
    });
  }
});

/**
 * @swagger
 * /api/v1/flashcards/course/{courseId}:
 *   get:
 *     summary: Get user's flashcards by course with filters
 *     description: Retrieve flashcards for a specific course with optional filtering
 *     tags:
 *       - Flashcards
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: masteryLevel
 *         schema:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         description: Filter by mastery level range
 *       - in: query
 *         name: lastReviewed
 *         schema:
 *           type: object
 *           properties:
 *             days:
 *               type: number
 *         description: Filter by days since last review
 *     responses:
 *       200:
 *         description: Course flashcards retrieved successfully
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
flashcardRoutes.get(
  "/course/:courseId",
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Unauthorized" });
      }

      const { courseId } = req.params;
      const { difficulty, tags, masteryLevel, lastReviewed } = req.query;

      // Parse query parameters
      const filters: any = {};
      if (difficulty) filters.difficulty = difficulty;
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
      if (masteryLevel) {
        try {
          filters.masteryLevel = JSON.parse(masteryLevel as string);
        } catch (e) {
          // Ignore invalid JSON
        }
      }
      if (lastReviewed) {
        try {
          filters.lastReviewed = JSON.parse(lastReviewed as string);
        } catch (e) {
          // Ignore invalid JSON
        }
      }

      const flashcards = await getUserFlashcardsByCourse(
        user.username,
        courseId,
        filters
      );

      res.status(StatusCodes.OK).json({
        message: "Course flashcards retrieved successfully",
        flashcards,
        count: flashcards.length,
        filters: filters,
      });
    } catch (error: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || "Failed to retrieve course flashcards",
      });
    }
  }
);

export default flashcardRoutes;
