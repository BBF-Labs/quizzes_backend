import { Document, Types } from "mongoose";

interface IQuestion extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  question: string;
  options: string[];
  answer: string;
  type: "mcq" | "fill-in" | "true-false";
  explanation?: string;
  lectureNumber?: string;
  hint?: string;
  author: Types.ObjectId;
  isModerated: boolean;
  moderatedBy: Types.ObjectId;
  year: number;
}

export default IQuestion;
