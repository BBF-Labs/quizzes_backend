import { Document, Types } from "mongoose";

interface IQuestion extends Document {
  id: string;
  courseCode: Types.ObjectId;
  options: string[];
  answer: string;
  type: "mcq" | "fill-in" | "true-false";
  explanation?: string;
  lectureNumber?: number;
  author: Types.ObjectId;
  isModerated: boolean;
}

export default IQuestion;
