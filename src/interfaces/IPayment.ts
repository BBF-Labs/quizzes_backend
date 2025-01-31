import { Document, Types } from "mongoose";

interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  date: Date;
  endsAt?: Date;
  isValid: boolean;
  method: "credit" | "momo" | "other" | "promo code";
  status: "pending" | "completed" | "failed";
  package: Types.ObjectId;
}

export default IPayment;
