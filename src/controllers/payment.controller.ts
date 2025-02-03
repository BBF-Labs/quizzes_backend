import axios from "axios";
import crypto from "crypto";
import { Config } from "../config";
import { IPayment } from "../interfaces";
import { Package, Payment, User } from "../models";

function paystackWebhook() {
  const secretKey = Config.PAYSTACK_SECRET_KEY;

  const initializePayment = (
    form: any,
    callback: (error: any, data: any) => void
  ) => {
    const options = {
      url: "https://api.paystack.co/transaction/initialize",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      data: form,
    };

    axios
      .post(options.url, options.data, { headers: options.headers })
      .then((response) => {
        if (response.data && response.data.data) {
          callback(null, response.data.data);
        } else {
          callback(new Error("Invalid response from Paystack"), null);
        }
      })
      .catch((error) => {
        callback(error, null);
      });
  };

  const verifyPayment = (
    ref: any,
    callback: (error: any, data: any) => void
  ) => {
    const options = {
      url: `https://api.paystack.co/transaction/verify/${ref}`,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    };

    axios
      .get(options.url, { headers: options.headers })
      .then((response) => {
        if (response.data && response.data.data) {
          callback(null, response.data.data);
        } else {
          callback(new Error("Invalid response from Paystack"), null);
        }
      })
      .catch((error) => {
        callback(error, null);
      });
  };

  return { initializePayment, verifyPayment };
}

async function createPayment(data: Partial<IPayment>) {
  try {
    const existingPayment = await Payment.findOne({
      userId: data.userId,
      package: data.package,
    });

    if (existingPayment) {
      throw new Error("Payment already exists");
    }

    const payment = new Payment(data);

    await payment.save();
    return payment;
  } catch (err: any) {
    throw new Error(`Error creating payment: ${err.message}`);
  }
}

async function updatePayment(reference: string, data: Partial<IPayment>) {
  try {
    const payment = await Payment.findOne({ reference });

    if (!payment) {
      throw new Error("Payment not found");
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      { reference },
      { ...data },
      { new: true }
    );

    return updatedPayment;
  } catch (err: any) {
    throw new Error(`Error updating payment: ${err.message}`);
  }
}

async function getPaymentByReference(reference: string) {
  try {
    const payment = await Payment.findOne({
      reference,
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment;
  } catch (err: any) {
    throw new Error(`Error getting payment: ${err.message}`);
  }
}

async function getPaymentByUserId(userId: string) {
  try {
    const payment = await Payment.findOne({
      userId,
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment;
  } catch (err: any) {
    throw new Error(`Error getting payment: ${err.message}`);
  }
}

async function getAllPayments() {
  try {
    const payments = await Payment.find();

    if (!payments) {
      throw new Error("Payments not found");
    }

    return payments;
  } catch (err: any) {
    throw new Error(`Error getting payments: ${err.message}`);
  }
}

async function getAllInvalidPayments() {
  try {
    const payments = await Payment.find({
      isValid: false,
    });

    if (!payments) {
      throw new Error("Payments not found");
    }

    return payments;
  } catch (err: any) {
    throw new Error(`Error getting payments: ${err.message}`);
  }
}

async function checkExistingPayment(userId: string, packageId: string) {
  try {
    const existingPayment = await Payment.findOne({
      userId,
      package: packageId,
    });

    if (existingPayment) {
      return true;
    }

    return false;
  } catch (err: any) {
    throw new Error(`Error checking existing payment: ${err.message}`);
  }
}

async function generateReference() {
  const maxAttempts = 5;
  const baseLength = 6;
  const charset = "0123456789abcdefghijklmnopqrstuvwxyz";

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const timestamp = Date.now().toString(36);
      const randomPart = Array.from(
        crypto.getRandomValues(new Uint8Array(baseLength))
      )
        .map((byte) => charset[byte % charset.length])
        .join("");

      const reference = `${randomPart}${timestamp}`.slice(0, baseLength);

      const payment = await Payment.findOne({ reference });

      if (!payment) {
        return reference;
      }
    } catch (error) {
      console.error("Error generating reference:", error);
    }
  }
  throw new Error(
    "Failed to generate a unique reference after multiple attempts"
  );
}

async function updateUserPaymentDetails(userId: string, reference: string) {
  try {
    const paymentDoc = await Payment.findOne({ reference: reference }).populate(
      "package"
    );

    if (!paymentDoc) {
      throw new Error("Payment not found");
    }

    const packageDoc = await Package.findById(paymentDoc.package);

    if (!packageDoc) {
      throw new Error("Package not found for this payment");
    }

    const durationInDays = packageDoc.duration;
    if (typeof durationInDays !== "number" || durationInDays <= 0) {
      throw new Error("Invalid package duration");
    }

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + durationInDays);

    await Payment.findByIdAndUpdate(
      paymentDoc._id,
      {
        endsAt: endsAt,
      },
      { new: true }
    );

    const updatedUser = await User.updateOne(
      { _id: userId },
      {
        $push: {
          packageId: packageDoc._id,
          paymentId: paymentDoc._id,
        },
        $set: {
          isSubscribed: true,
        },
      }
    );

    if (updatedUser.modifiedCount === 0) {
      throw new Error("User not found or no changes made");
    }

    const user = await User.findById(userId).populate("packageId");

    return user;
  } catch (err: any) {
    throw new Error(`Error updating user payment: ${err.message}`);
  }
}

export {
  paystackWebhook,
  createPayment,
  updatePayment,
  getPaymentByReference,
  getPaymentByUserId,
  getAllPayments,
  getAllInvalidPayments,
  checkExistingPayment,
  generateReference,
  updateUserPaymentDetails,
};
