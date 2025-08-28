import express from "express";
import { aiAssistantController } from "../controllers/aiAssistant.controller";
import { authenticateUser } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /api/v1/ai-assistant/ask:
 *   post:
 *     summary: Ask AI a question during quiz
 *     description: Get AI assistance while taking a quiz (requires subscription or credits)
 *     tags: [AI Assistant]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: The question to ask the AI
 *               context:
 *                 type: string
 *                 description: Additional context about the quiz or question
 *               quizId:
 *                 type: string
 *                 description: ID of the current quiz
 *               questionId:
 *                 type: string
 *                 description: ID of the current question (optional)
 *               flashcardId:
 *                 type: string
 *                 description: ID of the flashcard for context (optional)
 *               courseId:
 *                 type: string
 *                 description: ID of the course (optional)
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     answer:
 *                       type: string
 *                       description: AI generated answer in markdown format
 *                     explanation:
 *                       type: string
 *                       description: Detailed explanation in markdown format
 *                     relatedTopics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     confidence:
 *                       type: number
 *                       description: AI confidence level 0-1
 *                     usage:
 *                       type: object
 *                       properties:
 *                         tokensUsed:
 *                           type: number
 *                         remainingCredits:
 *                           type: number
 *       401:
 *         description: Authentication required
 *       403:
 *         description: AI access requires subscription or credits
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post("/ask", authenticateUser, aiAssistantController.askQuestion);

/**
 * @swagger
 * /api/v1/ai-assistant/usage:
 *   get:
 *     summary: Get AI usage statistics
 *     description: Retrieve user's AI usage statistics and remaining credits
 *     tags: [AI Assistant]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         status:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                     credits:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: number
 *                         used:
 *                           type: number
 *                         limit:
 *                           type: number
 *                     usage:
 *                       type: object
 *                       properties:
 *                         totalQuestions:
 *                           type: number
 *                         thisMonth:
 *                           type: number
 *                         lastUsed:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/usage", authenticateUser, aiAssistantController.getUsageStats);

export default router;
