import { Document, Types } from "mongoose";

interface IQuiz extends Document {
  id: string;
  title: string;
  description?: string;
  courseCode: Types.ObjectId;
  questions: Types.ObjectId[];
  creator: Types.ObjectId;
  isPublished: boolean;
}

export default IQuiz;
