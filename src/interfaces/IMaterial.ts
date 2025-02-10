import { Document, Types } from "mongoose";

interface IMaterial extends Document {
  _id: Types.ObjectId;
  title: string;
  url: string;
  type: "pdf" | "doc" | "slides" | "text" | "img" | "link";
  questionRefType: string;
  uploadedBy: Types.ObjectId;
  isProcessed: boolean;
  courseId: Types.ObjectId;
}

export default IMaterial;
