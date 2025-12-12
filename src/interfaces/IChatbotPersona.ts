import { Document, Types } from "mongoose";

interface IChatbotPersona extends Document {
  name: string;
  description: string;
  personalityTraits: string[];
  responseStyle:
    | "friendly"
    | "professional"
    | "encouraging"
    | "concise"
    | "detailed";
  systemPrompt: string;
  isDefault?: boolean;
  isActive?: boolean;
  usageCount?: number;
  averageRating?: number;
  schoolId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
}

export default IChatbotPersona;
