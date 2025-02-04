import { Document, Types } from "mongoose";

interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  reference: string;
  date: Date;
  endsAt?: Date | "lifetime";
  isValid: boolean;
  method: string;
  accessCode: string;
  status:
    | "abandoned"
    | "failed"
    | "ongoing"
    | "pending"
    | "processing"
    | "queued"
    | "success"
    | "reversed";
  package: Types.ObjectId;
}

export default IPayment;
