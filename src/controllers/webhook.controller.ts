import { Request, Response } from "express";
import Payment from "../models/payment.model";
import { IWebhookData } from "../interfaces";
import { StatusCodes } from "../config";

/**
 * Process successful payment webhook from Paystack
 */
const processSuccessfulPayment = async (webhookData: IWebhookData) => {
  try {
    const { reference, amount, status, paid_at, metadata } = webhookData.data;

    // Find payment by reference
    const payment = await Payment.findOne({ reference });

    if (!payment) {
      console.error(`Payment not found for reference: ${reference}`);
      return false;
    }

    // Update payment status
    if (status === "success") {
      payment.status = "success";
      payment.isValid = true;
      payment.date = new Date(paid_at);

      // If this is a package payment, set expiration date
      if (payment.package && payment.type === "duration") {
        // Set expiration based on package duration (you may need to adjust this logic)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
        payment.endsAt = expiresAt;
      }

      await payment.save();
      console.log(`Payment ${reference} marked as successful`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error processing successful payment:", error);
    return false;
  }
};

/**
 * Process failed payment webhook from Paystack
 */
const processFailedPayment = async (webhookData: IWebhookData) => {
  try {
    const { reference, status, gateway_response } = webhookData.data;

    const payment = await Payment.findOne({ reference });

    if (!payment) {
      console.error(`Payment not found for reference: ${reference}`);
      return false;
    }

    if (status === "failed" || status === "abandoned") {
      payment.status = "failed";
      payment.isValid = false;
      await payment.save();
      console.log(`Payment ${reference} marked as failed: ${gateway_response}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error processing failed payment:", error);
    return false;
  }
};

/**
 * Process pending payment webhook from Paystack
 */
const processPendingPayment = async (webhookData: IWebhookData) => {
  try {
    const { reference, status } = webhookData.data;

    const payment = await Payment.findOne({ reference });

    if (!payment) {
      console.error(`Payment not found for reference: ${reference}`);
      return false;
    }

    if (status === "pending" || status === "processing") {
      payment.status = status;
      await payment.save();
      console.log(`Payment ${reference} marked as ${status}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error processing pending payment:", error);
    return false;
  }
};

/**
 * Main Paystack webhook handler controller
 */
const handlePaystackWebhookController = async (req: Request, res: Response) => {
  try {
    const webhookData: IWebhookData = req.body;
    const { event, data } = webhookData;

    console.log(
      `Paystack webhook received: ${event} for reference: ${data.reference}`
    );

    // Handle different Paystack webhook events
    switch (event) {
      case "charge.success":
        await processSuccessfulPayment(webhookData);
        break;

      case "charge.failed":
        await processFailedPayment(webhookData);
        break;

      case "charge.pending":
      case "charge.processing":
        await processPendingPayment(webhookData);
        break;

      case "transfer.success":
        console.log("Transfer successful:", data.reference);
        break;

      case "transfer.failed":
        console.log("Transfer failed:", data.reference);
        break;

      case "refund.processed":
        console.log("Refund processed:", data.reference);
        break;

      case "subscription.create":
        console.log("Subscription created:", data.reference);
        break;

      case "subscription.disable":
        console.log("Subscription disabled:", data.reference);
        break;

      default:
        console.log(`Unhandled Paystack webhook event: ${event}`);
    }

    // Always return 200 to acknowledge receipt (Paystack requirement)
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Webhook processed successfully",
    });
  } catch (error: any) {
    console.error("Error processing Paystack webhook:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Error processing webhook",
      error: error.message,
    });
  }
};

/**
 * Test webhook endpoint (for development/testing)
 */
const testWebhookController = async (req: Request, res: Response) => {
  try {
    const { reference, status, amount } = req.body;

    if (!reference || !status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Reference and status are required",
      });
    }

    // Simulate webhook processing
    const payment = await Payment.findOne({ reference });

    if (!payment) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Payment not found",
      });
    }

    // Update payment status
    payment.status = status;
    payment.isValid = status === "success";

    if (status === "success") {
      payment.date = new Date();
      if (payment.package && payment.type === "duration") {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        payment.endsAt = expiresAt;
      }
    }

    await payment.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Test webhook processed successfully",
      payment: {
        reference: payment.reference,
        status: payment.status,
        isValid: payment.isValid,
      },
    });
  } catch (error: any) {
    console.error("Error processing test webhook:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Error processing test webhook",
      error: error.message,
    });
  }
};

// Export the controllers
export const handleWebhook = handlePaystackWebhookController;
export const testWebhook = testWebhookController;
