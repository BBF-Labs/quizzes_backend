import { Document } from "mongoose";

interface IPackage extends Document {
  id: string;
  price: number;
  name: string;
  duration: number;
  numberOfCourses?: number;
  courses?: string[];
  numberOfQuizzes?: number;
  quizzes?: string[];
  discountCode?: string;
}

export default IPackage;
