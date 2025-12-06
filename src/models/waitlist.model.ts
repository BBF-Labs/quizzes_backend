import mongoose, { Schema } from "mongoose";
import { IWaitlist } from "../interfaces";

const WaitlistSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please fill a valid email address",
            ],
        },
        university: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);
