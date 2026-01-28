import { Document } from "mongoose";

interface IWaitlist extends Document {
  name: string;
  email: string;
  university: string;
  isDeleted?: boolean;
  createdAt: Date;
}

export default IWaitlist;
