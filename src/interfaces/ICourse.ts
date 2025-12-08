import { Document, Types } from "mongoose";

interface ICourse extends Document {
  _id: Types.ObjectId;
  code: string;
  title?: string;
  about: string;
  numberOfLectures?: number;
  approvedQuestionsCount: number;
  semester: number;
  year: number;
  creditHours?: number;
  isDeleted?: boolean;
  students?: Types.ObjectId[];
  createdBy: Types.ObjectId;
  schoolId?: Types.ObjectId;
  campusId?: Types.ObjectId;
  isShared?: boolean;
  sharedWith?: Types.ObjectId[];
  sharedAcrossSchools?: boolean;
  sharedWithSchools?: Types.ObjectId[];
  tags?: string[];
}

export default ICourse;
