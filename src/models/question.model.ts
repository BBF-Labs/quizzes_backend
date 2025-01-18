import { Schema, model, Model } from "mongoose";
import { IQuestion } from "../interfaces";

const QuestionSchema = new Schema<IQuestion>(
  {
    id: {
      type: String,
      unique: true,
    },
    courseCode: {
      type: String,
      required: true,
      ref: "Course", 
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
      type: Number,
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
  },
  {
    timestamps: true, 
  }
);

const Question: Model<IQuestion> = model<IQuestion>("Question", QuestionSchema);
export default Question;
