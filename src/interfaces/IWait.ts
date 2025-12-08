import { Document } from "mongoose";

interface IWaitlist extends Document {
  name: string;
  email: string;
  university: string;
  createdAt: Date;
}

export default IWaitlist;
