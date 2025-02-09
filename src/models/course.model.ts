import { Schema, model, Model } from "mongoose";
import { ICourse } from "../interfaces";

const CourseSchema = new Schema<ICourse>(
  {
    code: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
    },
    about: {
      type: String,
      required: true,
    },
    numberOfLectures: {
      type: Number,
      required: false,
    },
    approvedQuestionsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    semester: {
      type: Number,
      required: true,
    },
    creditHours: {
      type: Number,
      default: 3,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    students: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Course: Model<ICourse> = model<ICourse>("Course", CourseSchema);
export default Course;
