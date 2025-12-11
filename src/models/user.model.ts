import { Schema, model, Model } from "mongoose";
import { IUser } from "../interfaces";

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
    },
    username: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    authKey: {
      type: String,
      lowercase: true,
    },
    courses: {
      type: [Schema.Types.ObjectId],
      ref: "Course",
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "admin", "moderator"],
      default: "student",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    accessType: {
      type: String,
      enum: ["quiz", "course", "duration", "default"],
      default: "default",
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    hasFreeAccess: {
      type: Boolean,
      default: true,
    },
    freeAccessCount: {
      type: Number,
      default: 2,
    },
    quizCredits: {
      type: Number,
      default: 1200,
    },
    paymentId: {
      type: [Schema.Types.ObjectId],
      ref: "Payment",
    },
    packageId: {
      type: [Schema.Types.ObjectId],
      ref: "Package",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "School",
    },
    campusId: {
      type: Schema.Types.ObjectId,
      ref: "Campus",
    },
    studyPartnerSessions: {
      type: [Schema.Types.ObjectId],
      ref: "StudyPartnerSession",
    },
    preferredPersonaId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "ChatbotPersona",
    },
    aiUsageStats: {
      totalCreditsUsed: {
        type: Number,
        default: 0,
      },
      creditsRemaining: {
        type: Number,
        default: 1200,
      },
      lastRechargeDate: {
        type: Date,
      },
      monthlyUsage: {
        type: Map,
        of: Number,
        default: {},
      },
      questionsAsked: {
        type: Number,
        default: 0,
      },
      explanationsRequested: {
        type: Number,
      }
    }
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = model<IUser>("User", UserSchema);
export default User;
