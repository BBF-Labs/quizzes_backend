import { Document } from "mongoose";

interface IProgress extends Document {
  id: string;
  userId: string;
  score: number;
  courseCode: string;
  quizId: string;
  completedAt: Date;
}

export default IProgress;
