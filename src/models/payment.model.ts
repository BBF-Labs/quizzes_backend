import mongoose, { Schema, model, Model } from "mongoose";
import { IPayment } from "../interfaces";

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    isValid: {
      type: Boolean,
      required: true,
    },
    method: {
      type: String,
      enum: ["credit", "momo", "other", "promo code"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      required: true,
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Payment: Model<IPayment> = model<IPayment>("Payment", PaymentSchema);
export default Payment;
