import {Schema, model, Model, SchemaType} from 'mongoose';
import { ISchool } from '../interfaces';

const SchoolSchema = new Schema<ISchool> (
    {
        name: {
            type: String,
        },
        code: {
          type: String,
        },
        description: {
            type: String,
        },
        campuses:{
            type: [Schema.Types.ObjectId],
            ref: "Campuses",
        },
        logo: {
            type: String,
        },
        website: {
            type: String,
        },
        isActive: {
            type: Boolean,
        },
        settings: {
            allowCrossSchoolSharing: {
                type: Boolean,
            },
            requireEmailVerification: {
                type: Boolean,
            },
            defaultStudentCredits: {
                type: Number,
            },
            allowPublicCourses: {
                type: Boolean,
            }
        },
    },
    {
        timestamps: true
    }
);              

const School: Model<ISchool> = model<ISchool>("School" ,SchoolSchema);
export default School;