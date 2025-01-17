import { Document } from "mongoose";

interface IPayment extends Document {
  id: string;
  userId: string;
  amount: number;
  date: Date;
  endsAt?: Date;
  isValid: boolean;
  method: "credit" | "momo" | "other" | "promo code";
  status: "pending" | "completed" | "failed";
  package: string;
}

export default IPayment;
