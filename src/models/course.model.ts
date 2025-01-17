import { Schema, model, Model } from "mongoose";
import { ICourse } from "../interfaces";

const CourseSchema = new Schema<ICourse>(
  {
    id: {
      type: String,
      unique: true,
    },
    
    code: {
      type: String,
      unique: true, 
      required: true,
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
  },
  {
    timestamps: true, 
  }
);

const Course: Model<ICourse> = model<ICourse>("Course", CourseSchema);
export default Course;
