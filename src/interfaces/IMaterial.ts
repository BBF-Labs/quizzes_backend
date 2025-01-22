import { Document, Types } from "mongoose";

interface IMaterial extends Document {
  _id: Types.ObjectId;
  title: string;
  url: string;
  type: "pdf" | "doc" | "slides" | "text" | "img";
  uploadedBy: Types.ObjectId;
  subject?: string;
}

export default IMaterial;
