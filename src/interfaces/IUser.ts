import { Document, Types } from "mongoose";

interface IUser extends Document {
  _id: Types.ObjectId;
  name?: string;
  username: string;
  email: string;
  password: string;
  authKey?: string;
  courses?: Types.ObjectId[];
  role: "student" | "admin" | "moderator";
  isBanned: boolean;
  isSubscribed: boolean;
  paymentId?: Types.ObjectId;
  lastLogin?: Date;
  isDeleted?: boolean;
}

export default IUser;
