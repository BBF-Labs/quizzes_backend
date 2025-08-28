import { Document, Types } from "mongoose";

interface IQuizLecture {
  name: string;
  completed: number;
  total: number;
  date: Date;
}
interface IProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  lectureProgress: IQuizLecture[];
  courseId: Types.ObjectId;
  quizId: Types.ObjectId;
}

export default IProgress;
