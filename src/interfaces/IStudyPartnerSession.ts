import { Document, Types } from "mongoose";

interface IStudyPartnerSession extends Document {
  sessionId: string;
  participants: Types.ObjectId[];
  courseId: Types.ObjectId;
  materialId?: Types.ObjectId;
  sessionType: "discussion" | "quiz-solving" | "material-review";
  isActive?: boolean;
  messages: {
    senderId: Types.ObjectId;
    content: string;
    timestamp: Date;
    isAI?: boolean;
    creditsUsed?: number;
    personaUsed?: string;
  }[];
  quizAttempts?: Types.ObjectId[];
  aiAssistanceEnabled?: boolean;
  activePersonaId?: Types.ObjectId;
  creditsUsed?: number;
  startedAt: Date;
  endedAt?: Date;
}

export default IStudyPartnerSession;
