import mongoose, { Schema, model, Model } from "mongoose";
import { IProgress } from "../interfaces";

const ProgressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: [
      {
        type: Number,
        required: true,
      },
    ],
    courseCode: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Progress: Model<IProgress> = model<IProgress>("Progress", ProgressSchema);
export default Progress;
