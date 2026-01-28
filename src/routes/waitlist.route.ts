import { Router } from "express";
import { addToWaitlist, getWaitlist, generateDailyUpdate, getPendingUpdate, approveUpdate, sendDailyUpdate } from "../controllers";
import { authGuard, authorizeRoles } from "../middlewares/auth.middleware";

const waitlistRoutes: Router = Router();

/**
 * @swagger
 * /api/v1/waitlist:
 *   post:
 *     summary: Add user to waitlist
 *     description: Submit name, email, and university to join the waitlist. Publicly accessible.
 *     tags:
 *       - Waitlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - university
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               university:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully added to waitlist
 *       400:
 *         description: Missing required fields or invalid email
 *       409:
 *         description: User already on waitlist
 *       500:
 *         description: Internal server error
 */
waitlistRoutes.post("/", addToWaitlist);

// Admin only routes
waitlistRoutes.use(authGuard, authorizeRoles("admin"));

/**
 * @swagger
 * /api/v1/waitlist:
 *   get:
 *     summary: Get all users in waitlist
 *     description: Retrieve a paginated list of all users currently in the waitlist. Admin only.
 *     tags:
 *       - Waitlist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved waitlist
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Internal server error
 */
waitlistRoutes.get("/", getWaitlist);

/**
 * @swagger
 * /api/v1/waitlist/update/generate:
 *   post:
 *     summary: Generate daily update draft
 *     description: Generates AI-powered markdown content for a newsletter update based on provided context. Admin only.
 *     tags: [Waitlist]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - context
 *             properties:
 *               context:
 *                 type: string
 *                 description: Context or updates to include in the AI generation
 *     responses:
 *       201:
 *         description: Draft generated successfully
 */
waitlistRoutes.post("/update/generate", generateDailyUpdate);

/**
 * @swagger
 * /api/v1/waitlist/update/pending:
 *   get:
 *     summary: Get pending daily update
 *     description: Retrieves the most recent draft or approved update that hasn't been sent yet. Admin only.
 *     tags: [Waitlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pending update retrieved
 *       404:
 *         description: No pending updates found
 */
waitlistRoutes.get("/update/pending", getPendingUpdate);

/**
 * @swagger
 * /api/v1/waitlist/update/approve/{id}:
 *   post:
 *     summary: Approve daily update
 *     description: Marks a draft update as approved and ready for sending. Admin only.
 *     tags: [Waitlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the EmailUpdate document
 *     responses:
 *       200:
 *         description: Update approved successfully
 *       404:
 *         description: Update not found
 */
waitlistRoutes.post("/update/approve/:id", approveUpdate);

/**
 * @swagger
 * /api/v1/waitlist/update/send/{id}:
 *   post:
 *     summary: Send daily update
 *     description: Queues a background job to send the approved update to all waitlist users. Admin only.
 *     tags: [Waitlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the EmailUpdate document
 *     responses:
 *       202:
 *         description: Bulk email job queued successfully
 *       400:
 *         description: Update not approved or already sent
 *       404:
 *         description: Update not found
 */
waitlistRoutes.post("/update/send/:id", sendDailyUpdate);

export default waitlistRoutes;
