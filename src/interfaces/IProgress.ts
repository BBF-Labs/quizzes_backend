import { Document, Types } from "mongoose";

interface IProgress extends Document {
  id: string;
  userId: Types.ObjectId;
  score: number;
  courseCode: Types.ObjectId;
  quizId: Types.ObjectId;
  completedAt: Date;
}

export default IProgress;
