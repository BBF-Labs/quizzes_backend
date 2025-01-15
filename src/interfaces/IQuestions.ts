import { Document } from "mongoose";
import IQuestion from "./IQuestion";

interface FilteredQuestions {
  name: string; //this would be the lecture number or IA or Quizzes
  questions: IQuestion[];
}

interface IQuestions extends Document {
  id: string;
  courseCode: string;
  isApproved: boolean;
  questions: FilteredQuestions[];
}

export default IQuestions;
