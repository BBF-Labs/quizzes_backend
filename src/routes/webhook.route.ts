import { Router } from "express";
import { handleWebhook, testWebhook } from "../controllers/webhook.controller";

const webhookRoutes: Router = Router();

/**
 * @swagger
 * /api/v1/webhooks/paystack:
 *   post:
 *     summary: Handle Paystack payment webhooks
 *     tags:
 *       - Webhooks
 *     description: Public endpoint for Paystack to send payment verification webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: The webhook event type
 *               data:
 *                 type: object
 *                 description: The payment data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Bad request - missing signature or timestamp
 *       401:
 *         description: Unauthorized - invalid signature
 *       500:
 *         description: Internal server error
 */
webhookRoutes.post("/paystack", handleWebhook);

/**
 * @swagger
 * /api/v1/webhooks/test:
 *   post:
 *     summary: Test webhook endpoint for development
 *     tags:
 *       - Webhooks
 *     description: Development endpoint to test webhook processing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reference:
 *                 type: string
 *                 description: Payment reference
 *               status:
 *                 type: string
 *                 description: Payment status
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *     responses:
 *       200:
 *         description: Test webhook processed successfully
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
webhookRoutes.post("/test", testWebhook);

export default webhookRoutes;
