import { Schema, model, Model } from "mongoose";
import { IQuestions } from "../interfaces";

const FilteredQuestionsSchema = new Schema({
  id: {
    type: String,
    unique: true,
  },
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
});

const QuestionsSchema = new Schema<IQuestions>(
  {
    courseCode: {
      type: String,
      required: true,
      ref: "Course",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    questions: [FilteredQuestionsSchema],
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
