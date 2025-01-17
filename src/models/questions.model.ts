import { Schema,model } from "mongoose";
import { IQuestions } from "../interfaces";

const QuestionsSchema = new Schema<IQuestions>(
    {
        id:
        {
            type: String,
            unique: true,
            required: true,
        },
        courseCode: {
            type: Schema.Types.String,
            ref: 'Course',
            required: true
        },
        isApproved:{
            type: Boolean,
            default: false
        },
        questions: [{
            type: Schema.Types.ObjectId,
            ref: false
        }
        ]
    },
    {
        timestamps: true 
    }
)

const Questions = model<IQuestions>('Questions', QuestionsSchema)
export default Questions