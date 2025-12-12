import mongoose, { Schema, model, Model } from "mongoose";
import { IProgress } from "../interfaces";

const ProgressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lectureProgress: [
      {
        name: {
          type: String,
          required: true,
        },
        completed: {
          type: Number,
          default: 0,
        },
        total: {
          type: Number,
        },
        date: {
          type: Date,
          default: new Date(),
        },
      },
    ],
    courseId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Course"
    },
    quizId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Quiz"
    },
  },
  {
    timestamps: true,
  }
);

const Progress: Model<IProgress> = model<IProgress>("Progress", ProgressSchema);
export default Progress;
