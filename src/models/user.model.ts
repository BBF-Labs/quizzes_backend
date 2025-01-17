import { timeStamp } from "console";
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
    hashedPassword: {
      type: String,
    },
    authKey: {},
    course: {},
    role: {},
    isBanned: {
      type: Boolean,
      default: false,
    },
    isSubscribed: {},
    paymentId: {},
    lastLogin: {},
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = model<IUser>("User", UserSchema);
export default User;
