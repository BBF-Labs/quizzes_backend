import { IQuizQuestion } from "../interfaces";
import { Question, Course, QuizQuestion } from "../models";
import mongoose from "mongoose";

async function batchCreateQuizQuestions(questionIds: string | string[]) {
  if (
    !questionIds ||
    (Array.isArray(questionIds) && questionIds.length === 0)
  ) {
    throw new Error("No question IDs provided");
  }

  // Normalize input to array
  const questionIdArray = Array.isArray(questionIds)
    ? questionIds
    : [questionIds];

  // Validate ObjectIds
  const validQuestionIds = questionIdArray.map((id) =>
    mongoose.Types.ObjectId.createFromHexString(id)
  );

  // Fetch questions with course and lecture info
  const questions = await Question.find({
    _id: { $in: validQuestionIds },
  }).lean();

  if (questions.length === 0) {
    throw new Error("No questions found");
  }

  // Group questions by course and lecture number
  const courseQuestionMap = questions.reduce((acc, question) => {
    if (!acc[question.courseId.toString()]) {
      acc[question.courseId.toString()] = {};
    }

    const lectureKey = `Lecture ${question.lectureNumber}`;
    if (!acc[question.courseId.toString()][lectureKey]) {
      acc[question.courseId.toString()][lectureKey] = [];
    }

    acc[question.courseId.toString()][lectureKey].push(question._id);
    return acc;
  }, {} as Record<string, Record<string, mongoose.Types.ObjectId[]>>);

  // Batch create/update quiz documents
  const updatedQuizDocuments = await Promise.all(
    Object.entries(courseQuestionMap).map(
      async ([courseId, lectureGroupings]) => {
        let quizDocument = await QuizQuestion.findOne({ courseId });

        if (!quizDocument) {
          quizDocument = new QuizQuestion({
            name: `${(await Course.findById(courseId))?.code || courseId} Quiz`,
            courseId: new mongoose.Types.ObjectId(courseId),
            quizQuestions: Object.entries(lectureGroupings).map(
              ([name, questions]) => ({
                name,
                questions,
              })
            ),
            creditHours: 3,
          });
        } else {
          // Update existing quiz document
          Object.entries(lectureGroupings).forEach(([name, questions]) => {
            const existingLectureIndex = quizDocument?.quizQuestions.findIndex(
              (lq) => lq.name === name
            );

            if (existingLectureIndex !== -1) {
              // Update existing lecture's questions, avoiding duplicates
              const uniqueQuestions = [
                ...new Set([
                  ...quizDocument!.quizQuestions[existingLectureIndex!]
                    .questions,
                  ...questions,
                ]),
              ];
              quizDocument!.quizQuestions[existingLectureIndex!].questions =
                uniqueQuestions;
            } else {
              // Add new lecture to quiz questions
              quizDocument!.quizQuestions.push({ name, questions });
            }
          });
        }

        return await quizDocument.save();
      }
    )
  );

  return updatedQuizDocuments;
}

async function getCourseQuizQuestions(courseId: string) {
  try {
    const questions = await QuizQuestion.findOne({ courseId });

    if (!questions) {
      return null;
    }

    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getQuizQuestions() {
  try {
    const questions = await QuizQuestion.find();

    if (questions.length == 0) {
      throw new Error("Quiz Questions not found");
    }

    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function updateQuizQuestion(quiz: Partial<IQuizQuestion>) {
  try {
    const { courseId, ...quizDetails } = quiz;

    const updateQuizDoc = await QuizQuestion.findOneAndUpdate(
      { courseId: courseId },
      { $set: quizDetails },
      { new: true }
    );

    return updateQuizDoc;
  } catch (err: any) {
    throw new Error(err.message);
  }
}
interface IFullQuizInfo {
  id: string;
  courseCode: string;
  isApproved: boolean;
  quizQuestions: Array<{
    name: string;
    questions: Array<{
      question: string;
      options: string[];
      answer: string;
      type: "mcq" | "fill-in" | "true-false";
      explanation?: string;
      lectureNumber?: string;
    }>;
  }>;
  creditHours?: number;
}

async function getFullQuizInformation(
  courseId: string
): Promise<IFullQuizInfo> {
  const quizDocument = await QuizQuestion.findOne({ courseId }).lean();

  if (!quizDocument) {
    throw new Error("No quiz found for this course");
  }

  const course = await Course.findById(courseId).select("name code").lean();

  if (!course) {
    throw new Error("Course not found");
  }

  const fullQuizQuestions = await Promise.all(
    quizDocument.quizQuestions.map(async (lectureQuiz) => ({
      name: lectureQuiz.name,
      questions: await Question.find({
        _id: { $in: lectureQuiz.questions },
      })
        .lean()
        .select("question options answer type explanation lectureNumber"),
    }))
  );

  return {
    id: quizDocument._id.toString(),
    courseCode: course.code,
    isApproved: quizDocument.isApproved,
    quizQuestions: fullQuizQuestions,
    creditHours: quizDocument.creditHours,
  };
}

export {
  getCourseQuizQuestions,
  getQuizQuestions,
  batchCreateQuizQuestions,
  updateQuizQuestion,
  getFullQuizInformation,
};
