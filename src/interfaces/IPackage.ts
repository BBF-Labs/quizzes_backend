import { Document, Types } from "mongoose";

interface IPackage extends Document {
  _id: Types.ObjectId;
  price: number;
  name: string;
  duration: number;
  access: "quiz" | "course" | "duration" | "default";
  isUpgradable?: boolean;
  numberOfCourses?: number;
  courses?: Types.ObjectId[];
  numberOfQuizzes?: number;
  quizzes?: Types.ObjectId[];
  discountCode?: string;
  discountPercentage?: number;
}

export default IPackage;
