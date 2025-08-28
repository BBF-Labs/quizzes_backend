import { Document } from "mongoose";

export interface IPersonalQuiz extends Document {
  title: string;
  description?: string;
  courseId: string;
  materialId: string;
  createdBy: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
    type: "multiple-choice" | "true-false" | "short-answer";
    difficulty: "easy" | "medium" | "hard";
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
