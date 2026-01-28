import { Document } from "mongoose";

export interface IEmailUpdate extends Document {
    subject: string;
    content: string;
    context?: string;
    type: 'update' | 'promotional' | 'security' | 'general';
    links?: { label: string; url: string }[];
    status: 'draft' | 'approved' | 'sent';
    sentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export default IEmailUpdate;
