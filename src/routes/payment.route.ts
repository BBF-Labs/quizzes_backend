import { Router, Request, Response } from "express";
import {
  findUserByUsername,
  paystackAPI,
  createPayment,
  updatePayment,
  getPaymentByReference,
  getPaymentByUserId,
  getAllPayments,
  getAllInvalidPayments,
  findUserById,
  checkExistingPayment,
  getPackageDetails,
  getPackageByDiscountCode,
  generateReference,
  updateUserPaymentDetails,
} from "../controllers";
import { StatusCodes } from "../config";
import { authenticateUser, authorizeRoles } from "../middlewares";

const { initializePayment, verifyPayment } = paystackAPI();

const paymentRoutes: Router = Router();

paymentRoutes.use(authenticateUser);

// Normalize Express params that may be string | string[] | ParsedQs
const asString = (val: unknown): string | undefined => {
  if (Array.isArray(val)) return asString(val[0]);
  return typeof val === "string" ? val : undefined;
};

const calculateDiscountedAmount = (
  packageDoc: any,
  discountCode?: string,
): number | null => {
  if (!packageDoc.discountCode || !packageDoc.discountPercentage) {
    return packageDoc.price;
  }

  if (discountCode !== packageDoc.discountCode) {
    return null;
  }

  const discountAmount =
    (packageDoc.price * packageDoc.discountPercentage) / 100;
  return packageDoc.price - discountAmount;
};

const processFreePayment = async (user: any, packageDoc: any) => {
  const ref = await generateReference();
  await createPayment({
    userId: user._id,
    amount: 0,
    reference: ref,
    date: new Date(),
    isValid: true,
    accessCode: "FREE",
    package: packageDoc ? packageDoc.id : null,
  });
};

/**
 * @swagger
 * /api/v1/payments/pay:
 *   post:
 *     summary: Initialize a new payment, handling both paid and free packages
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
 *               discountCode:
 *                 type: string
 *               packageId:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or package not found
 *       500:
 *         description: Internal server error
 */
paymentRoutes.post("/pay", async (req: Request, res: Response) => {
  try {
    const { packageId, discountCode, amount, type } = req.body;

    if (!amount && !packageId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid request: amount or packageId is required",
      });
      return;
    }

    const currentUser = req.user;
    if (!currentUser) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
      return;
    }

    const user = await findUserByUsername(currentUser.username);
    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
      return;
    }

    let packageDoc = null;
    let finalAmount = amount;

    if (packageId || discountCode) {
      packageDoc = discountCode
        ? await getPackageByDiscountCode(discountCode)
        : await getPackageDetails(packageId);

      if (!packageDoc) {
        res.status(StatusCodes.NOT_FOUND).json({
          message: "Package not found. Cannot create payment session",
        });
        return;
      }

      finalAmount = calculateDiscountedAmount(packageDoc, discountCode);
      if (finalAmount === null) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid discount code",
        });
        return;
      }
    }

    // Handle free payment
    if (finalAmount === 0) {
      await processFreePayment(user, packageDoc);
      res.status(StatusCodes.OK).json({
        message: "Payment processed successfully as free",
      });
      return;
    }

    // Initialize Paystack payment
    const paymentForm = {
      metadata: { full_name: user.name },
      email: user.email,
      currency: "GHS",
      amount: finalAmount * 100,
      type: type || "default",
    };

    try {
      const paystackResponse = await initializePayment(paymentForm);

      if (!paystackResponse || !paystackResponse.authorization_url) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: "Invalid response from Paystack",
        });
        return;
      }

      await createPayment({
        userId: user._id,
        amount: paymentForm.amount,
        reference: paystackResponse.reference,
        date: new Date(),
        isValid: false,
        type: paymentForm.type,
        accessCode: paystackResponse.access_code,
        package: packageId || null,
      });

      res.status(StatusCodes.OK).json({
        message: "Success",
        authorization_url: paystackResponse.authorization_url,
        reference: paystackResponse.reference,
      });
      return;
    } catch (paymentError: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: paymentError.message || "Payment initialization failed",
      });
      return;
    }
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Internal Server Error",
    });
  }
});

/**
 * @swagger
 * /api/v1/payments/{reference}/verify:
 *   get:
 *     summary: Verify the payment using the payment reference
 *     tags:
 *       - Payments
 *     security:
 *      - BearerAuth: []
 *     parameters:
 *       - name: reference
 *         in: path
 *         required: true
 *         description: The payment reference to verify
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     reference:
 *                       type: string
 *                     status:
 *                       type: string
 *                     amount:
 *                       type: number
 *       400:
 *         description: Payment verification failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
paymentRoutes.get("/:reference/verify", async (req: Request, res: Response) => {
  try {
    const reference = asString(req.params.reference);
    const user = req.user;

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Login to access this route",
      });
      return;
    }

    const userDoc = await findUserByUsername(user.username);
    if (!userDoc) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "User does not exist",
      });
      return;
    }

    const referenceDoc = await getPaymentByReference(reference as string);
    if (!referenceDoc) {
      res.status(StatusCodes.NOT_FOUND).json({
        message: "Transaction not found",
        isValid: false,
      });
      return;
    }

    if (referenceDoc.isValid) {
      // If already valid, no need to verify again
      if (!reference) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Reference is required" });
        return;
      }
      await updateUserPaymentDetails(reference);
      res.status(StatusCodes.OK).json({
        message: "Transaction is already valid",
        isValid: true,
      });
      return;
    }

    // Verify the payment with Paystack
    try {
      const data = await verifyPayment(reference as string);

      if (!data || !data.status) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Payment verification failed",
        });
        return;
      }

      // Update payment record
      const isValid = data.status === "success";
      await updatePayment(reference as string, {
        status: data.status,
        isValid,
        method: data.channel,
      });

      if (isValid) {
        if (!reference) {
          res
            .status(StatusCodes.BAD_REQUEST)
            .json({ message: "Reference is required" });
          return;
        }
        await updateUserPaymentDetails(reference);
      }

      res.status(StatusCodes.OK).json({
        message: "Payment verified",
        transaction: data,
        isValid,
      });
    } catch (paymentError: any) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `Payment verification error: ${paymentError.message}`,
      });
      return;
    }
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Internal Server Error",
    });
  }
});

/**
 * @swagger
 * /api/v1/payments/{reference}:
 *   get:
 *     summary: Get payment details by reference
 *     tags:
 *       - Payments
 *     security:
 *      - BearerAuth: []
 *     parameters:
 *       - name: reference
 *         in: path
 *         required: true
 *         description: The payment reference to get details
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 payment:
 *                   type: object
 *                   properties:
 *                     reference:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
paymentRoutes.get("/:reference", async (req: Request, res: Response) => {
  try {
    const reference = asString(req.params.reference);

    if (!reference) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Reference is required" });
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
 * /api/v1/payments/i/user:
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
paymentRoutes.get("/i/user", async (req: Request, res: Response) => {
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
 * /api/v1/payments/user/{userId}:
 *   get:
 *     summary: Get payments of a specific user (Admin only)
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
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
      const userId = asString(req.params.userId);

      if (!userId) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "User id is required" });
        return;
      }

      const userDoc = await findUserById(userId as string);

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
  },
);

/**
 * @swagger
 * /api/v1/payments/invalid:
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
  },
);

/**
 * @swagger
 * /api/v1/payments/:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 *       500:
 *         description: Internal server error
 */
paymentRoutes.get(
  "/",
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const payments = await getAllPayments();

      if (!payments) {
        res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "No payments found", payment: payments });
      }

      res
        .status(StatusCodes.OK)
        .json({ message: "Success", payment: payments });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `Error: ${err.message}` });
    }
  },
);

export default paymentRoutes;
