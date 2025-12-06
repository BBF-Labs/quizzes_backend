import { Document } from "mongoose";

export default interface IWaitlist extends Document {
    name: string;
    email: string;
    university: string;
    createdAt: Date;
}
