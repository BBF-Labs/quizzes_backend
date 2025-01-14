import { Document } from "mongoose";

interface IUser extends Document {
  id: string;
  username: string;
  email: string;
  hashedPassword: string;
  authKey?: string;
  course: string;
  role: "student" | "admin" | "moderator";
  isBanned: boolean;
  isSubscribed: boolean;
  paymentId?: string;
  lastLogin?: Date;
}

export default IUser;
