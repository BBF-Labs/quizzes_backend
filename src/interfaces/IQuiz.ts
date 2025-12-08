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
  schoolId?: Types.ObjectId;
  campusId?: Types.ObjectId;
  accessLevel?: "campus" | "school" | "shared" | "public";
  allowedCampuses?: Types.ObjectId[];
  allowedSchools?: Types.ObjectId[];
  tags?: string[];
}

export default IQuiz;
