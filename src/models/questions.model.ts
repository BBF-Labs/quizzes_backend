import { Schema, model, Model } from "mongoose";
import { IQuestions } from "../interfaces";

const QuestionsSchema = new Schema<IQuestions>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Course",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    quizQuestions: [
      {
        name: {
          type: String,
          required: true,
        },
        questions: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Questions: Model<IQuestions> = model<IQuestions>(
  "Questions",
  QuestionsSchema
);

export default Questions;
