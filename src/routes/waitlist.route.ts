import { Router } from "express";
import {
    addToWaitlist,
    getWaitlist,
    deleteFromWaitlist,
    restoreFromWaitlist,
    unsubscribe,
    generateDailyUpdate,
    getPendingUpdate,
    getAllUpdates,
    updateEmailUpdate,
    approveUpdate,
    sendDailyUpdate
} from "../controllers";
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
/**
 * @swagger
 * /api/v1/waitlist/unsubscribe:
 *   get:
 *     summary: Unsubscribe from the waitlist
 *     description: Set isDeleted to true for a user via their email.
 *     tags: [Waitlist]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipient email address
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *       404:
 *         description: Email not found
 */
waitlistRoutes.get("/unsubscribe", unsubscribe);

// Admin only routes
waitlistRoutes.use(authGuard, authorizeRoles("admin"));

/**
 * @swagger
 * /api/v1/waitlist:
 *   get:
 *     summary: Get paginated waitlist members
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
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
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: university
 *         schema:
 *           type: string
 *       - in: query
 *         name: showDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, only show soft-deleted members
 *     responses:
 *       200:
 *         description: List of waitlist members
 */
waitlistRoutes.get("/", getWaitlist);

/**
 * @swagger
 * /api/v1/waitlist/{id}:
 *   delete:
 *     summary: Soft delete a waitlist entry
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entry soft-deleted successfully
 */
waitlistRoutes.delete("/:id", deleteFromWaitlist);

/**
 * @swagger
 * /api/v1/waitlist/restore/{id}:
 *   patch:
 *     summary: Restore a user to the waitlist (Soft delete reversal)
 *     tags: [Waitlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the waitlist entry to restore
 *     responses:
 *       200:
 *         description: Waitlist entry restored successfully
 *       404:
 *         description: Waitlist entry not found
 *       500:
 *         description: Internal server error
 */
waitlistRoutes.patch("/restore/:id", restoreFromWaitlist);

/**
 * @swagger
 * /api/v1/waitlist/update/generate:
 *   post:
 *     summary: Generate an AI update draft
 *     tags: [Waitlist Update]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               context:
 *                 type: string
 *               emailType:
 *                 type: string
 *                 enum: [update, promotional, security, general]
 *               links:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label: string
 *                     url: string
 *     responses:
 *       201:
 *         description: Draft generated
 */
waitlistRoutes.post("/update/generate", generateDailyUpdate);

/**
 * @swagger
 * /api/v1/waitlist/update/pending:
 *   get:
 *     summary: Get the current pending update draft
 *     tags: [Waitlist Update]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending update entry
 */
waitlistRoutes.get("/update/pending", getPendingUpdate);

/**
 * @swagger
 * /api/v1/waitlist/updates:
 *   get:
 *     summary: Get all historical updates
 *     tags: [Waitlist Update]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated update history
 */
waitlistRoutes.get("/updates", getAllUpdates);

/**
 * @swagger
 * /api/v1/waitlist/update/{id}:
 *   patch:
 *     summary: Edit an existing update draft
 *     tags: [Waitlist Update]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject: string
 *               content: string
 *     responses:
 *       200:
 *         description: Update saved
 */
waitlistRoutes.patch("/update/:id", updateEmailUpdate);

/**
 * @swagger
 * /api/v1/waitlist/update/approve/{id}:
 *   post:
 *     summary: Approve an update for sending
 *     tags: [Waitlist Update]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Approved
 */
waitlistRoutes.post("/update/approve/:id", approveUpdate);

/**
 * @swagger
 * /api/v1/waitlist/update/send/{id}:
 *   post:
 *     summary: Queue the update for bulk delivery
 *     tags: [Waitlist Update]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Job queued
 */
waitlistRoutes.post("/update/send/:id", sendDailyUpdate);

export default waitlistRoutes;
