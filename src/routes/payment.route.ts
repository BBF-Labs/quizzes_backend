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
  checkExistingPayment,
  getPackageDetails,
  getPackageByDiscountCode,
  generateReference,
  updateUserPaymentDetails,
} from "../controllers";
import { StatusCodes } from "../config";
import { authenticateUser, authorizeRoles } from "../middlewares";

const { initializePayment, verifyPayment } = paystackWebhook();

const paymentRoutes: Router = Router();

paymentRoutes.use(authenticateUser);

/**
 * @swagger
 * /payments/pay:
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
    const form = req.body;

    if (!form) {
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

    let packageDoc = null;
    if (form.discountCode) {
      packageDoc = await getPackageByDiscountCode(form.discountCode);
    } else if (form.packageId) {
      packageDoc = await getPackageDetails(form.packageId);
    }

    if (!packageDoc) {
      res.status(StatusCodes.NOT_FOUND).json({
        message: "Package not found. Cannot create payment session",
      });
      return;
    }

    const isDiscountable =
      packageDoc.discountCode && packageDoc.discountPercentage ? true : false;

    if (isDiscountable) {
      if (form.discountCode !== packageDoc.discountCode) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid discount code",
        });
        return;
      }

      const discountAmount =
        (packageDoc.price * packageDoc.discountPercentage!) / 100;
      form.amount = packageDoc.price - discountAmount;
    }

    if (packageDoc.discountPercentage === 100 || form.amount === 0) {
      const ref = await generateReference();
      const paymentData = {
        userId: user._id,
        amount: 0,
        reference: ref,
        date: new Date(),
        isValid: true,
        accessCode: "FREE",
        package: packageDoc.id || null,
      };

      await createPayment(paymentData);

      res.status(StatusCodes.OK).json({
        message: "Payment processed successfully as free",
      });
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
        package: form.packageId || null,
      };

      await createPayment(paymentData);

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
 * /payments/{reference}/verify:
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
    const { reference } = req.params;

    const user = req.user;

    if (!user) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Login to Access this route" });
      return;
    }

    const userDoc = await findUserByUsername(user.username);

    if (!userDoc) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User Does not exists" });
      return;
    }

    const referenceDoc = await getPaymentByReference(reference);

    if (!referenceDoc) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Transaction Not Found", isValid: false });
      return;
    }

    if (referenceDoc.isValid) {
      await updateUserPaymentDetails(userDoc._id.toString(), reference);
      res
        .status(StatusCodes.OK)
        .json({ message: "Transaction is Valid", isValid: true });
      return;
    }

    verifyPayment(reference, async (error: any, data: any) => {
      if (error || !data || !data.status) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Payment verification failed" });
      }

      await updatePayment(reference, {
        status: data.status,
        isValid: data.status === "success",
        method: data.channel,
      });

      await updateUserPaymentDetails(userDoc._id.toString(), reference);

      res.status(StatusCodes.OK).json({
        message: "Payment verified",
        transaction: data,
        isValid: true,
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
 * /payments/{reference}:
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
    const { reference } = req.params;

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
