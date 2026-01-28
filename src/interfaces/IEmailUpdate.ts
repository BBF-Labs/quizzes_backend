import { Document } from "mongoose";

export interface IEmailUpdate extends Document {
    subject: string;
    content: string;
    context?: string;
    status: 'draft' | 'approved' | 'sent';
    sentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export default IEmailUpdate;
