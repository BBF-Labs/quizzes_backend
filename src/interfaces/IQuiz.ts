import { Document, Types } from "mongoose";

interface IQuiz extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  courseCode: Types.ObjectId;
  questions: Types.ObjectId[];
  creator: Types.ObjectId;
  isPublished: boolean;
  year: number;
}

export default IQuiz;
