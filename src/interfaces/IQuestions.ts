import { Document, Types } from "mongoose";
import IQuestion from "./IQuestion";

interface FilteredQuestions {
  name: string; //this would be the lecture number or IA or Quizzes
  questions: Types.ObjectId[];
}

interface IQuestions extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  isApproved: boolean;
  quizQuestions: FilteredQuestions[];
}

export default IQuestions;
