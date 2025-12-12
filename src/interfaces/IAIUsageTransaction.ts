import { Types, Document } from "mongoose";

interface IAIUsageTransaction extends Document {
  userId: Types.ObjectId;
  transactionType: "debit"| "credit" | "refund";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  aiResponse: Types.ObjectId;
  sessionId: Types.ObjectId;
  paymentId: Types.ObjectId;
  metadata: Types.ObjectId;
}

export default IAIUsageTransaction;