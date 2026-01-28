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
waitlistRoutes.get("/unsubscribe", unsubscribe);

// Admin only routes
waitlistRoutes.use(authGuard, authorizeRoles("admin"));

waitlistRoutes.get("/", getWaitlist);
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

waitlistRoutes.post("/update/generate", generateDailyUpdate);
waitlistRoutes.get("/update/pending", getPendingUpdate);
waitlistRoutes.get("/updates", getAllUpdates);
waitlistRoutes.patch("/update/:id", updateEmailUpdate);
waitlistRoutes.post("/update/approve/:id", approveUpdate);
waitlistRoutes.post("/update/send/:id", sendDailyUpdate);

export default waitlistRoutes;
