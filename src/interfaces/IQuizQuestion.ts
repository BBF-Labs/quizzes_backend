import { Document, Types } from "mongoose";
import IQuestion from "./IQuestion";

interface FilteredQuestions {
  name: string; //this would be the lecture number or IA or Quizzes
  questions: Types.ObjectId[];
}

interface IQuizQuestion extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  isApproved: boolean;
  quizQuestions: FilteredQuestions[];
  creditHours: number;
}

export default IQuizQuestion;
