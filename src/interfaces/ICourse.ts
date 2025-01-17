import { Document } from "mongoose";

interface ICourse extends Document {
  id: string;
  code: string;
  about: string;
  numberOfLectures?: number;
  approvedQuestionsCount: number;
}

export default ICourse;
