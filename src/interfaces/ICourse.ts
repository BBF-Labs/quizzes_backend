import { Document, Types } from "mongoose";

interface ICourse extends Document {
  id: string;
  code: string;
  about: string;
  numberOfLectures?: number;
  approvedQuestionsCount: number;
  isDeleted?: boolean;
  students?: Types.ObjectId[];
}

export default ICourse;
