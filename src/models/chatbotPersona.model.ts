import { Schema, model, Model } from "mongoose";
import { IChatbotPersona } from "../interfaces";

const ChatbotPersonaSchema = new Schema<IChatbotPersona>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    personalityTraits: {
      type: [String],
      required: true,
    },
    responseStyle: {
      type: String,
      enum: ["friendly", "professional", "encouraging", "concise", "detailed"],
      required: true,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      // The uniqueness will require a custom logic
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    }, 
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: false, //Migration Notes
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true
  },
);

ChatbotPersonaSchema.index({isDefault: 1, isActive: 1});
ChatbotPersonaSchema.index({schoolId: 1, isActive: 1 });

const ChatbotPersona: Model<IChatbotPersona> = model<IChatbotPersona>("ChatbotPersona", ChatbotPersonaSchema);
export default ChatbotPersona;