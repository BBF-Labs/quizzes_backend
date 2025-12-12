import { Document, Types } from "mongoose";

export interface IPersonalQuiz extends Document {
  title: string;
  description?: string;
  courseId: Types.ObjectId;
  materialId: Types.ObjectId;
  createdBy: Types.ObjectId;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
    type: "mcq" | "true-false" | "short-answer";
    difficulty: "basic" | "immediate" | "advance" | "critical";
    lectureNumber?: string;
    hint?: string;
  }>;
  settings: {
    timeLimit?: number; // in minutes
    shuffleQuestions: boolean;
    showHints: boolean;
    showExplanations: boolean;
    allowRetakes: boolean;
    passingScore: number; // percentage
  };
  stats: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    lastAttempted?: Date;
  };
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default IPersonalQuiz;
