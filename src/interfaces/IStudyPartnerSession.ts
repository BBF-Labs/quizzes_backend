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
    personaUsed?: Types.ObjectId;
  }[];
  quizAttempts?: Types.ObjectId[];
  aiAssistanceEnabled?: boolean;
  activePersonaId?: Types.ObjectId;
  totalCreditsUsed?: number;
  startedAt: Date;
  endedAt?: Date;
}

export default IStudyPartnerSession;
