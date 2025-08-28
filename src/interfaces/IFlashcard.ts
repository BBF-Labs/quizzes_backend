import { Document, Types } from "mongoose";

interface IFlashcard extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  materialId: Types.ObjectId;
  front: string;
  back: string;
  lectureNumber: string;
  createdBy: Types.ObjectId;
  isPublic: boolean;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  lastReviewed?: Date;
  reviewCount: number;
  masteryLevel: number; // 0-100
}

export default IFlashcard;
