import mongoose, { Schema, model, Model } from "mongoose";
import { IPackage } from "../interfaces";

const PackageSchema: Schema<IPackage> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    numberOfQuizzes: {
      type: Number,
      default: 0,
    },
    quizzes: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    numberOfCourses: {
      type: Number,
      default: 0,
    },
    courses: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    discountCode: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Package: Model<IPackage> = model<IPackage>("Package", PackageSchema);
export default Package;
