import { Schema, model, Model} from "mongoose";
import IAIUsageTransaction from "../interfaces/IAIUsageTransaction";

const AIUsageTransactionSchema = new Schema<IAIUsageTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    transactionType: {
      type: String,
      enum: ["debit", "credit", "refund"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    aiResponse: {
      type: Schema.Types.ObjectId,
      ref: "AIResponse",
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "StudyPartner",
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    metadata: {
      modelUsage: {
        type: String,
      },
      tokensConsumed: {
        type: Number,
      },
      responseTime: {
        type: Number,
      }
    }
  },
  {
    timestamps: true,
  }
);

AIUsageTransactionSchema.index({userId: 1, createdAt: -1});

const AiUsageTransaction: Model<IAIUsageTransaction> = model<IAIUsageTransaction>("AiUsageTransaction", AIUsageTransactionSchema);
export default AiUsageTransaction;

