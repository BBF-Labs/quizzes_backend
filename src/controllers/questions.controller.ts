import { IQuestion } from "../interfaces";
import { Question, Questions } from "../models";
import { Types } from "mongoose";

async function createQuizQuestions(
  questions: Partial<IQuestion[]> | Partial<IQuestion>
): Promise<void> {
  try {
    // Normalize input to always be an array
    const questionArray = Array.isArray(questions) ? questions : [questions];

    // Find questions with matching IDs
    const questionDocs = await Question.find({
      _id: { $in: questionArray.map((q) => q?._id).filter(Boolean) },
    });

    if (!questionDocs.length) {
      throw new Error("No valid questions found");
    }

    // Assuming all questions are from the same course
    const courseId = questionDocs[0].courseId;

    // Organize questions by lecture
    const lectureQuestions = questionDocs.reduce((acc, doc) => {
      const lectureName = `Lecture ${doc.lectureNumber}`;
      acc[lectureName] ??= [];
      acc[lectureName].push(doc._id);
      return acc;
    }, {} as Record<string, Types.ObjectId[]>);

    // Find existing quiz for the course
    let existingQuiz = await Questions.findOne({ courseId });

    if (existingQuiz) {
      // Update existing quiz
      for (const [lectureName, questionIds] of Object.entries(
        lectureQuestions
      )) {
        const lectureIndex = existingQuiz.quizQuestions.findIndex(
          (q) => q.name === lectureName
        );

        if (lectureIndex >= 0) {
          existingQuiz.quizQuestions[lectureIndex].questions = [
            ...new Set([
              ...existingQuiz.quizQuestions[lectureIndex].questions,
              ...questionIds,
            ]),
          ];
        } else {
          existingQuiz.quizQuestions.push({
            name: lectureName,
            questions: questionIds,
          });
        }
      }

      await existingQuiz.save();
    } else {
      // Create new quiz
      const newQuiz = new Questions({
        courseId,
        quizQuestions: Object.entries(lectureQuestions).map(
          ([name, questions]) => ({ name, questions })
        ),
      });

      await newQuiz.save();
    }
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getCourseQuizQuestions(courseId: string) {
  try {
    const questions = await Questions.find({ courseId });

    if (!questions) {
      throw new Error("Course Questions not found");
    }

    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getQuizQuestions() {
  try {
    const questions = await Questions.find();

    if (!questions) {
      throw new Error("Quiz Questions not found");
    }

    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export { getCourseQuizQuestions, getQuizQuestions, createQuizQuestions };
