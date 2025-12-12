import { Schema, model, Model } from "mongoose";
import { IQuiz } from "../interfaces";

const QuizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    courseCode: {
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
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: false, // Migration Notes 
    },
    campusId: {
      type: Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    accessLevel: {
      type: String,
      enum: ["campus", "school", "shared", "public"],
      default: "public",
    },
    allowedCampuses: {
      type: [Schema.Types.ObjectId],
      ref: "Campus",
    },
    allowedSchools: {
      type: [Schema.Types.ObjectId],
      ref: "School",
      required: false, // Migration Notes
    },
    tags: {
      type: [String]
    }
  },
  {
    timestamps: true,
  }
);

QuizSchema.index({courseCode: 1, campusId: 1});
QuizSchema.index({creator: 1, isPublished: 1});
QuizSchema.index({accessLevel: 1, campusId: 1});

const Quiz: Model<IQuiz> = model<IQuiz>("Quiz", QuizSchema);
export default Quiz;
