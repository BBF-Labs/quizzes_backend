import { Course, Question } from "../models";
import { isValidObjectId } from "mongoose";
import { IQuestion } from "../interfaces";
import { findCourseByCode, findCourseById } from "./course.controller";
import { findUserByUsername } from "./user.controller";

async function createQuestion(
  question: Partial<IQuestion>,
  author: string,
  courseId?: string
) {
  try {
    const user = await findUserByUsername(author);

    if (!user) {
      throw new Error("Your account does not exist");
    }

    const { _id } = user;

    if (courseId) {
      const isValidCourse = await findCourseById(courseId);

      if (!isValidCourse) {
        throw new Error("Course does not exist");
      }
    }

    if (question.courseId) {
      const isValidCourse = await findCourseById(question.courseId.toString());

      if (!isValidCourse) {
        throw new Error("Course does not exist");
      }
    }

    const newQuestion = new Question({
      ...question,
      courseId: question.courseId || courseId,
      author: _id,
    });

    await newQuestion.save();

    return newQuestion;
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
    const questions = await Question.find({
      courseId,
      isModerated: { $ne: true },
    });

    if (!questions) {
      throw new Error("Course Questions not found");
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
  questions: Partial<IQuestion> | Partial<IQuestion>[],
  author: string,
  courseId?: string
) {
  try {
    const user = await findUserByUsername(author);
    if (!user) {
      throw new Error("Your account does not exist");
    }

    if (courseId && !isValidObjectId(courseId)) {
      throw new Error(`Invalid course ID format: ${courseId}`);
    }

    if (courseId) {
      const isValidCourse = await findCourseById(courseId);
      if (!isValidCourse) {
        throw new Error("Course does not exist");
      }
    }

    const { _id } = user;
    const questionArray = Array.isArray(questions) ? questions : [questions];

    const courseIds = questionArray
      .map((q) => q.courseId)
      .filter((id) => id !== undefined);

    const invalidIds = courseIds.filter((id) => !isValidObjectId(id));

    if (invalidIds.length > 0) {
      throw new Error(`Invalid course ID format(s): ${invalidIds.join(", ")}`);
    }

    const validCourses = await Course.find({ _id: { $in: courseIds } });
    const validCourseIds = new Set(
      validCourses.map((course) => course._id.toString())
    );

    const nonexistentIds = courseIds.filter(
      (id) => !validCourseIds.has(id.toString())
    );

    if (nonexistentIds.length > 0) {
      throw new Error(`Course IDs do not exist: ${nonexistentIds.join(", ")}`);
    }

    const newQuestions = questionArray.map((question) => ({
      ...question,
      courseId: question.courseId || courseId,
      author: _id,
    }));

    await Question.insertMany(newQuestions);

    return newQuestions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function batchModerateQuestions(
  questionIds: string[],
  moderator: string
) {
  try {
    const user = await findUserByUsername(moderator);

    if (!user) {
      throw new Error("Your account does not exist");
    }

    const { _id } = user;

    const question = await Question.updateMany(
      { _id: { $in: questionIds } },
      { $set: { isModerated: true, moderatedBy: _id } }
    );

    if (!question) {
      throw new Error("Questions not found");
    }

    return question;
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
