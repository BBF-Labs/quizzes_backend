import { Schema, model, Model } from "mongoose";
import { ICampus } from "../interfaces";

const CampusSchema = new Schema<ICampus>(
  {
    name: {
      type: String,
    },
    code: {
      type: String,
    },
    schoolId: [{
      type: [Schema.Types.ObjectId],
      ref: 'SchoolId',
    }],

  }
)