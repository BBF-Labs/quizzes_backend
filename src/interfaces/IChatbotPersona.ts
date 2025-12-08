import { Types } from "mongoose";

export default interface IChatbotPersona {
  name: string;
  description: string;
  personalityTraits: string[];
  responseStyle:
    | "friendly"
    | "professional"
    | "encouraging"
    | "concise"
    | "detailed";
  systemInstructions: string;
  isDefault?: boolean;
  isActive?: boolean;
  usageCount?: number;
  averageRating?: number;
  schoolId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
}
