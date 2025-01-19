import mongoose, { Schema, model, Model } from "mongoose";
import { IMaterial } from "../interfaces";

const MaterialSchema: Schema<IMaterial> = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
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
      enum: ["pdf", "doc", "slides", "text", "img"],
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Material: Model<IMaterial> = model<IMaterial>("Material", MaterialSchema);
export default Material;
