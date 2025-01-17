import { Document } from "mongoose";

interface IQuiz extends Document {
  id: string;
  title: string;
  description?: string;
  courseCode: string;
  questions: string[];
  creator: string;
  isPublished: boolean;
}

export default IQuiz;
