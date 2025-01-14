import { Document } from "mongoose";

interface IQuestion extends Document {
  id: string;
  courseCode: string;
  options: string[];
  answer: string;
  explanation?: string;
  lectureNumber?: number;
  author: string;
  isModerated: boolean;
}

export default IQuestion;
