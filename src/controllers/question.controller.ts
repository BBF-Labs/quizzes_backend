import { Question } from "../models";
import { IQuestion } from "../interfaces";
import { findCourseByCode } from "./course.controller";

async function createQuestion(question: Partial<IQuestion>, courseId: string) {
  try {
    const newQuestion = new Question({
      ...question,
      courseId,
    });

    await newQuestion.save();
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getQuestions(courseId: string) {
  try {
    const questions = await Question.find({ courseId, isModerated: true });

    if (!questions) {
      const courseCode = await findCourseByCode(courseId);

      if (!courseCode) {
        throw new Error("Course Questions not found");
      }

      const questions = await Question.find({ courseId: courseCode._id });

      if (!questions) {
        throw new Error("Course Questions not found");
      }

      return questions;
    }

    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getQuestionById(questionId: string) {
  try {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    return question;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function updateQuestion(
  questionId: string,
  question: Partial<IQuestion>
) {
  try {
    const questionDoc = await Question.findByIdAndUpdate(questionId, question, {
      new: true,
    });

    if (!questionDoc) {
      throw new Error("Question not found");
    }

    return questionDoc;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getCourseQuestions(courseId: string) {
  try {
    const questions = await Question.find({ courseId });

    if (!questions) {
      throw new Error("Course Questions not found");
    }

    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getUncheckedQuestions(courseId: string) {
  try {
    const questions = await Question.find({ courseId, isModerated: false });

    if (!questions) {
      throw new Error("Unchecked Questions not found");
    }
    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getQuestionByCourseCode(courseCode: string) {
  try {
    const course = await findCourseByCode(courseCode);

    if (!course) {
      throw new Error("Course Questions not found");
    }

    const questions = await Question.find({ courseId: course?._id });

    if (!questions) {
      throw new Error("Course Questions not found");
    }

    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function batchCreateQuestions(
  questions: Partial<IQuestion>[],
  courseId: string
) {
  try {
    const newQuestions = questions.map((question) => ({
      ...question,
      courseId,
    }));

    await Question.insertMany(newQuestions);
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function batchModerateQuestions(questionIds: string[]) {
  try {
    await Question.updateMany(
      { _id: { $in: questionIds } },
      { $set: { isModerated: true } }
    );
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  getCourseQuestions,
  getUncheckedQuestions,
  getQuestionByCourseCode,
  batchCreateQuestions,
  batchModerateQuestions,
};
