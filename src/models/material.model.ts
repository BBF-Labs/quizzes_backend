import mongoose, { Schema, model, Model } from "mongoose";
import { IMaterial } from "../interfaces";

const MaterialSchema: Schema<IMaterial> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["pdf", "doc", "slides", "text", "img", "link"],
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Material: Model<IMaterial> = model<IMaterial>("Material", MaterialSchema);
export default Material;
