import { Router, Request, Response } from "express";
import {
  findUserByUsername,
  paystackWebhook,
  createPayment,
  updatePayment,
  getPaymentByReference,
  getPaymentByUserId,
  getAllPayments,
  getAllInvalidPayments,
  findUserById,
} from "../controllers";
import { StatusCodes } from "../config";
import { authenticateUser, authorizeRoles } from "../middlewares";

const { initializePayment, verifyPayment } = paystackWebhook();

const paymentRoutes: Router = Router();

paymentRoutes.use(authenticateUser);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 *       500:
 *         description: Internal server error
 */
paymentRoutes.get(
  "/",
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const payments = await getAllPayments();

      res.status(StatusCodes.OK).json({ message: "Success", payments });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  }
);

/**
 * @swagger
 * /payments/pay:
 *   post:
 *     summary: Initialize a new payment
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
paymentRoutes.post("/pay", async (req: Request, res: Response) => {
  try {
    const form = req.body;

    if (!form || !form.amount) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid request: username and amount are required",
      });
      return;
    }

    const currentUser = req.user;

    if (!currentUser) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
      return;
    }

    const username = currentUser.username;

    const user = await findUserByUsername(username);

    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
      return;
    }

    form.metadata = { full_name: user.name };
    form.email = user.email;
    form.currency = "GHS";
    form.amount *= 100;

    initializePayment(form, async (error: any, body: any) => {
      if (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: error.message,
        });
        return;
      }

      if (!body || !body.authorization_url) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: "Invalid response from Paystack",
        });
        return;
      }

      const paymentData = {
        userId: user._id,
        amount: form.amount,
        reference: body.reference,
        date: new Date(),
        isValid: false,
        accessCode: body.access_code,
      };

      await createPayment(paymentData);

      console.log(body);

      res.status(StatusCodes.OK).json({
        message: "Success",
        authorization_url: body.authorization_url,
        reference: body.reference,
      });
    });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

/**
 * @swagger
 * /payments/verify/{reference}:
 *   get:
 *     summary: Verify a payment by reference
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Payment verification failed
 *       500:
 *         description: Internal server error
 */
paymentRoutes.get("/verify/:reference", async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Payment reference is required" });
      return;
    }

    verifyPayment(reference, async (error: any, data: any) => {
      if (error) {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: error.message });
        return;
      }

      if (!data || !data.status) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Payment verification failed" });
        return;
      }

      const paymentData = {
        status: data.status,
        isValid: data.status === "success",
        method: data.channel,
      };

      await updatePayment(reference, paymentData);

      return res.status(StatusCodes.OK).json({
        message: "Payment verified successfully",
        transaction: data,
      });
    });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

paymentRoutes.get("/callback", async (req: Request, res: Response) => {
  try {
    res.status(StatusCodes.OK).json({ message: "Callback endpoint" });
  } catch (error: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
});

/**
 * @swagger
 * /payments/ref/{reference}:
 *   get:
 *     summary: Get payment details by reference
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
paymentRoutes.get("/ref/:reference", async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Payment reference is required" });
      return;
    }

    const payment = await getPaymentByReference(reference);

    if (!payment) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Payment not found" });
      return;
    }

    res.status(StatusCodes.OK).json({ message: "Success", payment });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

/**
 * @swagger
 * /payments/user:
 *   get:
 *     summary: Get payments of the authenticated user
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's payment details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
paymentRoutes.get("/user", async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
      return;
    }

    const username = user.username;

    if (!username) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Username is required" });
      return;
    }

    const userDoc = await findUserByUsername(username);

    if (!userDoc) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
      return;
    }

    const payment = await getPaymentByUserId(userDoc._id.toString());

    res.status(StatusCodes.OK).json({ message: "Success", payment });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
});

/**
 * @swagger
 * /payments/user/{userId}:
 *   get:
 *     summary: Get payments of a specific user (Admin only)
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's payment details retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
paymentRoutes.get(
  "/user/:userId",
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "User id is required" });
        return;
      }

      const userDoc = await findUserById(userId);

      if (!userDoc) {
        res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
        return;
      }

      const payment = await getPaymentByUserId(userDoc._id.toString());

      res.status(StatusCodes.OK).json({ message: "Success", payment });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  }
);

/**
 * @swagger
 * /payments/invalid:
 *   get:
 *     summary: Get all invalid payments (Admin only)
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of invalid payments
 *       500:
 *         description: Internal server error
 */
paymentRoutes.get(
  "/invalid",
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const payment = await getAllInvalidPayments();

      res.status(StatusCodes.OK).json({ message: "Success", payment });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  }
);

export default paymentRoutes;
