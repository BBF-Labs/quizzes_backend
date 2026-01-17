import mongoose, { Schema, Document } from "mongoose";
import { IPersonalQuiz } from "../interfaces";

const PersonalQuizSchema = new Schema<IPersonalQuiz>(
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
    materialId: {
      type: Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: {
          type: [String],
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        explanation: {
          type: String,
        },
        type: {
          type: String,
          enum: ["mcq", "true-false", "fill-in", "short-answer"],
          default: "mcq",
        },
        difficulty: {
          type: String,
          enum: ["basic", "intermediate", "advanced", "critical"],
          default: "intermediate",
        },
        lectureNumber: {
          type: String,
        },
        hint: {
          type: String,
        },
      },
    ],
    settings: {
      timeLimit: {
        type: Number,
        min: 0,
      },
      shuffleQuestions: {
        type: Boolean,
        default: true,
      },
      showHints: {
        type: Boolean,
        default: true,
      },
      showExplanations: {
        type: Boolean,
        default: true,
      },
      allowRetakes: {
        type: Boolean,
        default: true,
      },
      passingScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 70,
      },
    },
    stats: {
      totalAttempts: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      bestScore: {
        type: Number,
        default: 0,
      },
      lastAttempted: {
        type: Date,
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
PersonalQuizSchema.index({ courseId: 1, createdBy: 1 });
PersonalQuizSchema.index({ materialId: 1 });
PersonalQuizSchema.index({ createdBy: 1, isPublic: 1 });
PersonalQuizSchema.index({ tags: 1 });

export const PersonalQuiz = mongoose.model<IPersonalQuiz>(
  "PersonalQuiz",
  PersonalQuizSchema,
);
