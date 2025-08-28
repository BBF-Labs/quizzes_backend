import mongoose, { Schema, model, Model } from "mongoose";
import { IFlashcard } from "../interfaces";

const FlashcardSchema: Schema<IFlashcard> = new Schema(
  {
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
    front: {
      type: String,
      required: true,
      trim: true,
    },
    back: {
      type: String,
      required: true,
      trim: true,
    },
    lectureNumber: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    lastReviewed: {
      type: Date,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    masteryLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
FlashcardSchema.index({ courseId: 1, createdBy: 1 });
FlashcardSchema.index({ materialId: 1 });
FlashcardSchema.index({ tags: 1 });
FlashcardSchema.index({ difficulty: 1 });

const Flashcard: Model<IFlashcard> = model<IFlashcard>(
  "Flashcard",
  FlashcardSchema
);

export default Flashcard;
