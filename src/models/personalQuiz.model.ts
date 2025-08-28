import mongoose, { Schema, model, Model } from "mongoose";
import { IPersonalQuiz } from "../interfaces";
import crypto from "crypto";

const PersonalQuizSchema: Schema<IPersonalQuiz> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    settings: {
      timeLimit: {
        type: Number,
        min: 0,
      },
      showHints: {
        type: Boolean,
        default: true,
      },
      showExplanations: {
        type: Boolean,
        default: true,
      },
      randomizeQuestions: {
        type: Boolean,
        default: false,
      },
      allowRetakes: {
        type: Boolean,
        default: true,
      },
      passingScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    estimatedDuration: {
      type: Number,
      default: 30,
      min: 1,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    shareExpiry: {
      type: Date,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PersonalQuizSchema.index({ courseId: 1, createdBy: 1 });
PersonalQuizSchema.index({ isPublic: 1, isPublished: 1 });
PersonalQuizSchema.index({ tags: 1 });
PersonalQuizSchema.index({ difficulty: 1 });
PersonalQuizSchema.index({ shareToken: 1 });

// Pre-save middleware to generate share token if needed
PersonalQuizSchema.pre("save", function (next) {
  if (this.isPublic && !this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString("hex");
    this.shareExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  this.lastModified = new Date();
  next();
});

const PersonalQuiz: Model<IPersonalQuiz> = model<IPersonalQuiz>(
  "PersonalQuiz",
  PersonalQuizSchema
);

export default PersonalQuiz;
