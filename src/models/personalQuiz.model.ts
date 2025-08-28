import mongoose, { Schema, Document } from "mongoose";

export interface IPersonalQuiz extends Document {
  title: string;
  description?: string;
  courseId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
    type: "mcq" | "fill-in" | "true-false";
    difficulty: "basic" | "intermediate" | "advanced" | "critical";
    lectureNumber?: string;
    hint?: string;
  }>;
  settings: {
    timeLimit?: number; // in minutes
    shuffleQuestions: boolean;
    showHints: boolean;
    showExplanations: boolean;
    allowRetakes: boolean;
    passingScore: number; // percentage
  };
  stats: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    lastAttempted?: Date;
  };
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

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
          enum: ["mcq", "true-false", "fill-in"],
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
  }
);

// Indexes for better query performance
PersonalQuizSchema.index({ courseId: 1, createdBy: 1 });
PersonalQuizSchema.index({ materialId: 1 });
PersonalQuizSchema.index({ createdBy: 1, isPublic: 1 });
PersonalQuizSchema.index({ tags: 1 });

export const PersonalQuiz = mongoose.model<IPersonalQuiz>(
  "PersonalQuiz",
  PersonalQuizSchema
);
