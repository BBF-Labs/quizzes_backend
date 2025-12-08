import { Document, Types } from "mongoose";

export default interface IStudyPartnerSession extends Document {
  sessionId: string;
  participants: Types.ObjectId[];
  courseId: Types.ObjectId;
  materialId?: Types.ObjectId;
  sessionType: "discussion" | "quiz-solving" | "material-review";
  isActive?: boolean;
  message: {
    senderId: Types.ObjectId;
    content: string;
    timestamp: Date;
    isAI?: boolean;
    creditsUsed?: number;
    personaUsed?: string;
  }[];
  quizAttempts?: Types.ObjectId[];
  aiAssistanceEnabled?: boolean;
  activePersonaId?: string;
  creditsUsed?: number;
  startedAt: Date;
  endedAt?: Date;
}
