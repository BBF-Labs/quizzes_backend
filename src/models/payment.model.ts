import mongoose, { Schema, model, Model } from "mongoose";
import { IPayment } from "../interfaces";

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Schema.Types.Date,
      default: null,
    },
    isValid: {
      type: Boolean,
      required: true,
    },
    method: {
      type: String,
      default: "mobile_money",
    },
    accessCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "abandoned",
        "failed",
        "ongoing",
        "pending",
        "processing",
        "queued",
        "success",
        "reversed",
      ],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["course", "quiz", "duration","credits", "default"],
      default: "default",
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: "Package",
    },
    creditsAdded: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({userId: 1, status: 1});



const Payment: Model<IPayment> = model<IPayment>("Payment", PaymentSchema);
export default Payment;
