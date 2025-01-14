import { Document } from "mongoose";

interface IMaterial extends Document {
  id: string;
  title: string;
  url: string;
  type: "pdf" | "doc" | "slides" | "text" | "img";
  uploadedBy: string;
  subject?: string;
}

export default IMaterial;
