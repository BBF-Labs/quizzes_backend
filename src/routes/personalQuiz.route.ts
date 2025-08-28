import express from "express";
import {
  createPersonalQuiz,
  getUserPersonalQuizzes,
  getPersonalQuiz,
  updatePersonalQuiz,
  deletePersonalQuiz,
  regenerateQuestions,
  getPublicPersonalQuizzes,
} from "../controllers/personalQuiz.controller";
import { authenticateUser } from "../middlewares";

const router = express.Router();

/**
 * @swagger
 * /api/v1/personal-quizzes:
 *   post:
 *     summary: Create a new personal quiz
 *     tags: [Personal Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - courseId
 *               - materialId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               courseId:
 *                 type: string
 *               materialId:
 *                 type: string
 *               settings:
 *                 type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Material or course not found
 */
router.post("/", authenticateUser, createPersonalQuiz);

/**
 * @swagger
 * /api/v1/personal-quizzes/user:
 *   get:
 *     summary: Get all personal quizzes for the authenticated user
 *     tags: [Personal Quizzes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of personal quizzes
 *       401:
 *         description: Unauthorized
 */
router.get("/user", authenticateUser, getUserPersonalQuizzes);

/**
 * @swswagger
 * /api/v1/personal-quizzes/public:
 *   get:
 *     summary: Get public personal quizzes
 *     tags: [Personal Quizzes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: List of public personal quizzes
 */
router.get("/public", getPublicPersonalQuizzes);

/**
 * @swagger
 * /api/v1/personal-quizzes/{quizId}:
 *   get:
 *     summary: Get a specific personal quiz
 *     tags: [Personal Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 */
router.get("/:quizId", authenticateUser, getPersonalQuiz);

/**
 * @swagger
 * /api/v1/personal-quizzes/{quizId}:
 *   put:
 *     summary: Update a personal quiz
 *     tags: [Personal Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               questions:
 *                 type: array
 *               settings:
 *                 type: object
 *               isPublic:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 */
router.put("/:quizId", authenticateUser, updatePersonalQuiz);

/**
 * @swagger
 * /api/v1/personal-quizzes/{quizId}:
 *   delete:
 *     summary: Delete a personal quiz
 *     tags: [Personal Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 */
router.delete("/:quizId", authenticateUser, deletePersonalQuiz);

/**
 * @swagger
 * /api/v1/personal-quizzes/{quizId}/regenerate:
 *   post:
 *     summary: Regenerate questions for a personal quiz
 *     tags: [Personal Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionCount:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Questions regenerated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Quiz not found
 */
router.post("/:quizId/regenerate", authenticateUser, regenerateQuestions);

export default router;
