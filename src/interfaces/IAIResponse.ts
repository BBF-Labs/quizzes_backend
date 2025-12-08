import { Document, Types } from "mongoose";

export default interface IAIResponse extends Document {
  userId: Types.ObjectId;
  questionId?: Types.ObjectId;
  query: string;
  responses: {
    modelName: string;
    response: string;
    probabilityScore?: number;
    responseTimeMs?: number;
    tokensUsed?: number;
    evaluationMetrics?: {
      accuracy?: number;
      relevance?: number;
      clarity?: number;
      confidence?: number;
    };
  }[];
  selectedResponse?: string;
  selectedModelName?: string;
  creditsCharged: number;
  sessionId?: Types.ObjectId;
  queryType: "explanation" | "answer" | "hint" | "discussion" | "other";
  personaId?: Types.ObjectId;
}
