import { Document } from "mongoose";

interface IUser extends Document {
  id: string;
  username: string;
  email: string;
  password: string;
  authKey?: string;
  course?: string;
  role: "student" | "admin" | "moderator";
  isBanned: boolean;
  isSubscribed: boolean;
  paymentId?: string;
  lastLogin?: Date;
  isDeleted?: boolean;
}

export default IUser;
