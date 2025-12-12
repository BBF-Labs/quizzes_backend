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
    year: {
      type: Number,
      default: new Date().getFullYear(),
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
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: false, // Migration Notes
    },
    campusId: {
      type: Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedWith: {
      type: [Schema.Types.ObjectId],
      ref: "Campus",
    },
    sharedAcrossSchools: {
      type: Boolean,
      default: false,
      required: false, // Migration notes
    },
    sharedWithSchools: {
      type: [Schema.Types.ObjectId],
      ref: "School",
      required: false, // Migration Notes
    },
    tags: {
      type: [String],
    }
  },
  {
    timestamps: true,
  }
);

const Course: Model<ICourse> = model<ICourse>("Course", CourseSchema);
export default Course;
