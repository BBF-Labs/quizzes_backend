import mongoose, { Schema } from "mongoose";
import { IEmailUpdate } from "../interfaces/IEmailUpdate";

const EmailUpdateSchema: Schema = new Schema(
    {
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        context: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['draft', 'approved', 'sent'],
            default: 'draft',
        },
        sentAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IEmailUpdate>("EmailUpdate", EmailUpdateSchema);
