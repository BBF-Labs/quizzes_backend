import { Document, Types } from "mongoose";

interface ICourse extends Document {
  _id: Types.ObjectId;
  code: string;
  title?: string;
  about: string;
  numberOfLectures?: number;
  approvedQuestionsCount: number;
  semester: number;
  isDeleted?: boolean;
  students?: Types.ObjectId[];
  createdBy: Types.ObjectId;
}

export default ICourse;
