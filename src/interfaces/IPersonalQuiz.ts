import { Document, Types } from "mongoose";

interface IPersonalQuiz extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  courseId: Types.ObjectId;
  questions: Types.ObjectId[];
  createdBy: Types.ObjectId;
  isPublic: boolean;
  isPublished: boolean;
  settings: {
    timeLimit?: number;
    showHints: boolean;
    showExplanations: boolean;
    randomizeQuestions: boolean;
    allowRetakes: boolean;
    passingScore: number;
  };
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  estimatedDuration: number; // in minutes
  shareToken?: string; // for sharing via URL
  shareExpiry?: Date;
  completionCount: number;
  averageScore: number;
  lastModified: Date;
}

export default IPersonalQuiz;
