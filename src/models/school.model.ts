import {Schema, model, Model, SchemaType} from 'mongoose';
import { ISchool } from '../interfaces';

const SchoolSchema = new Schema<ISchool> (
    {
        name: {
            type: String,
            required: true,
        },
        code: {
          type: String,
          unique: true,
          required: true,
        },
        description: {
            type: String,
        },
        campuses:{
            type: [Schema.Types.ObjectId],
            ref: "Campus",
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
                default: false,
            },
            requireEmailVerification: {
                type: Boolean,
                default: true,
            },
            defaultStudentCredits: {
                type: Number,
                default: 1200
            },
            allowPublicCourses: {
                type: Boolean,
                default: true
            }
        },
    },
    {
        timestamps: true
    }
);

SchoolSchema.index({code:1}, {unique: true});

const School: Model<ISchool> = model<ISchool>("School" ,SchoolSchema);
export default School;