import { Document, Types } from "mongoose";

interface IUser extends Document {
  id: string;
  username: string;
  email: string;
  password: string;
  authKey?: string;
  course?: Types.ObjectId;
  role: "student" | "admin" | "moderator";
  isBanned: boolean;
  isSubscribed: boolean;
  paymentId?: Types.ObjectId;
  lastLogin?: Date;
  isDeleted?: boolean;
}

export default IUser;
