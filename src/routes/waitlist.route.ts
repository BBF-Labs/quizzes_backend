import { Router } from "express";
import { addToWaitlist, getWaitlist } from "../controllers";

const waitlistRoutes: Router = Router();

/**
 * @swagger
 * /api/v1/waitlist:
 *   post:
 *     summary: Add user to waitlist
 *     description: Submit name, email, and university to join the waitlist
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
 *         description: Missing required fields
 *       409:
 *         description: User already on waitlist
 *       500:
 *         description: Internal server error
 */
waitlistRoutes.post("/", addToWaitlist);

/**
 * @swagger
 * /api/v1/waitlist:
 *   get:
 *     summary: Get all users in waitlist
 *     description: Retrieve a list of all users currently in the waitlist
 *     tags:
 *       - Waitlist
 *     responses:
 *       200:
 *         description: Successfully retrieved waitlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       university:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
waitlistRoutes.get("/", getWaitlist);

export default waitlistRoutes;
