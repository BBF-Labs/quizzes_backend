import { Document, Types } from "mongoose";

interface ISchool extends Document {
  name: string;
  code: string;
  description?: string;
  campuses?: Types.ObjectId[];
  logo?: string;
  website?: string;
  isActive?: boolean;
  settings?: {
    allowCrossSchoolSharing: boolean;
    requireEmailVerification: boolean;
    defaultStudentCredits: number;
    allowPublicCourses: boolean;
  };
}

export default ISchool;
