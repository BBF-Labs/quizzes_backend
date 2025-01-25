import { Document, Types } from "mongoose";

interface IPackage extends Document {
  _id: Types.ObjectId;
  price: number;
  name: string;
  duration: number;
  numberOfCourses?: number;
  courses?: Types.ObjectId[];
  numberOfQuizzes?: number;
  quizzes?: Types.ObjectId[];
  discountCode?: string;
}

export default IPackage;
