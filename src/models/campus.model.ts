import { Schema, model, Model } from "mongoose";
import { ICampus } from "../interfaces";

const CampusSchema = new Schema<ICampus>(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      unique: true,
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "School",
    },
    location: {
      type: String,
      required: true,
    },
    allowResourceSharing: {
      type: Boolean,
      default: true,
    },
    sharedWithCampuses: {
      type: [Schema.Types.ObjectId],
      ref: "Campus",
    },
    students: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    courses: {
      type: [Schema.Types.ObjectId],
      ref:"Course",
    },
    admins: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Campus : Model<ICampus> = model<ICampus>("Campus", CampusSchema);
export default Campus;