import { Schema, model, Model } from "mongoose";
import { IStudyPartnerSession } from "../interfaces";
import { timeStamp } from "console";

const StudyPartnerSessionSchema = new Schema<IStudyPartnerSession>(
  {
    sessionId: {
      type: String,
      unique: true,
      required: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: "User",
    },
    courseId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Course",
    },
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
    },
    sessionType: {
      type: String,
      enum: ["discussion", "quiz-solving", "material-review"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    messages: [{
      senderId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
      content: {
        type: String,
        required: true,
      },
      timeStamp: {
        type: Date,
      },
      isAI: {
        type: Boolean,
        default: false,
      },
      creditsConsumed: {
        type: Number,
        default: 0,
      },
      personaUsed: {
        type: Schema.Types.ObjectId,
        ref: "ChatbotPersona",
      }
    }],
    quizAttempts: {
      type: [Schema.Types.ObjectId],
      ref: "Quiz",
    },
    aiAssistanceEnabled: {
      type: Boolean,
      default: true,
    },
    activePersonaId: {
      type: Schema.Types.ObjectId,
      default: null,
      required: false, //Migration Notes
      ref: "ChatbotPersona",
    },
    totalCreditsUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true
  }
);

StudyPartnerSessionSchema.index({sessionId: 1}, {unique: true});
StudyPartnerSessionSchema.index({participants: 1, isActive: 1});
StudyPartnerSessionSchema.index({courseId: 1, isActive: 1});

const StudyPartnerSession: Model<IStudyPartnerSession> = model<IStudyPartnerSession>("StudyPartnerSession", StudyPartnerSessionSchema);
export default StudyPartnerSession;