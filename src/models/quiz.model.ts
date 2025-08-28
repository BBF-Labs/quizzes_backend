import { Schema, model, Model } from "mongoose";
import { IQuiz } from "../interfaces";

const QuizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    courseCode: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
  },
  {
    timestamps: true,
  }
);

const Quiz: Model<IQuiz> = model<IQuiz>("Quiz", QuizSchema);
export default Quiz;
