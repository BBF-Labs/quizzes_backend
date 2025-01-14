import { Document } from "mongoose";

interface IQuestions extends Document {
  id: string;
  courseCode: string;
  isApproved: boolean;
  questions: string[];
}

export default IQuestions;
