import { Document, Types } from "mongoose";

interface IProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  score: number;
  courseCode: Types.ObjectId;
  quizId: Types.ObjectId;
  completedAt: Date;
}

export default IProgress;
