import axios from "axios";
import { Config } from "../config";
import { IPayment } from "../interfaces";
import { Payment } from "../models";

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

export {
  paystackWebhook,
  createPayment,
  updatePayment,
  getPaymentByReference,
  getPaymentByUserId,
  getAllPayments,
  getAllInvalidPayments,
};
