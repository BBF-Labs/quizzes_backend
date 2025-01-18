import { Schema, model, Model } from "mongoose";
import { IUser } from "../interfaces";

const UserSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      unique: true,
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
    },
    authKey: {
      type: String,
      lowercase: true,
    },
    course: {
      type: Schema.Types.ObjectId,
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
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = model<IUser>("User", UserSchema);
export default User;
