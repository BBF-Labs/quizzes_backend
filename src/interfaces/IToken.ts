import { Document, Types } from "mongoose";

export default interface IToken extends Document {
  accessToken: string;
  refreshToken: string;
  date: Date;
  userId: Types.ObjectId;
}
