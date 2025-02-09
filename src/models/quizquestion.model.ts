import { Schema, model, Model } from "mongoose";
import { IQuizQuestion } from "../interfaces";

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Course",
      unique: true,
    },
    name: {
      type: String,
      required: true,
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
        questions: [
          {
            type: Schema.Types.ObjectId,
            ref: "Question",
            required: true,
          },
        ],
      },
    ],
    creditHours: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const QuizQuestion: Model<IQuizQuestion> = model<IQuizQuestion>(
  "Quizzes",
  QuizQuestionSchema
);

export default QuizQuestion;
