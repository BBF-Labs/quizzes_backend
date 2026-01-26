import { Schema, model, Model } from "mongoose";
import { IQuestion } from "../interfaces";

const QuestionSchema = new Schema<IQuestion>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Course",
    },
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["mcq", "fill-in", "true-false"],
      required: true,
    },
    explanation: {
      type: String,
    },
    lectureNumber: {
      type: String,
    },
    hint: {
      type: String,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    aiGeneratedExplanation: {
      type: String,
    },
    aiConfidenceScore: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({courseId: 1, isModerated: 1});


const Question: Model<IQuestion> = model<IQuestion>("Question", QuestionSchema);
export default Question;
