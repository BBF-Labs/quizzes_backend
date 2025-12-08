import { Document, Types } from "mongoose";

interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  reference: string;
  date: Date;
  endsAt?: Date;
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
  type: "course" | "quiz" | "duration" | "credits" | "default";
  package: Types.ObjectId;
  creditsAdded?: number;
}

export default IPayment;
