import { Types, Document } from "mongoose";

interface ICampus extends Document {
  name: string;
  code: string;
  schoolId: Types.ObjectId;
  location: string;
  allowResourceSharing?: boolean;
  sharedWithCampuses?: Types.ObjectId[];
  students?: Types.ObjectId[];
  courses?: Types.ObjectId[];
  admins?: Types.ObjectId[];
  isActive?: boolean;
}

export default ICampus;
