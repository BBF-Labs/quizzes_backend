import { Course, Question, User } from "../models";
import { isValidObjectId } from "mongoose";
import { IQuestion, IPagination, PaginatedResult } from "../interfaces";
import {
  findCourseByCode,
  findCourseById,
  updateCourse,
} from "./course.controller";
import { findUserByUsername } from "./user.controller";
import mongoose from "mongoose";

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

    const { _id: authorId } = user;

    const validCourseId = question.courseId || courseId;

    if (validCourseId) {
      const isValidCourse = await findCourseById(validCourseId.toString());
      if (!isValidCourse) {
        throw new Error("Course does not exist");
      }
    }

    // Check for duplicate question
    const existingQuestion = await Question.findOne({
      courseId: new mongoose.Types.ObjectId(validCourseId),
      question: question.question,
      type: question.type,
    });

    if (existingQuestion) {
      throw new Error("Duplicate question already exists in this course");
    }

    const newQuestion = new Question({
      ...question,
      courseId: new mongoose.Types.ObjectId(validCourseId),
      author: authorId,
    });

    await newQuestion.save();

    return newQuestion;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getQuestions(
  courseId: string,
  query: IPagination = { page: 1, limit: 10 }
): Promise<PaginatedResult<IQuestion>> {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const baseQuery = { courseId, isModerated: true };

    const [questions, total] = await Promise.all([
      Question.find(baseQuery).skip(skip).limit(limit),
      Question.countDocuments(baseQuery),
    ]);

    if (!questions || questions.length === 0) {
      // Fallback logic for finding by code (if needed, but simpler first)
      const courseCode = await findCourseByCode(courseId);
      if (courseCode) {
        const fallbackQuery = { courseId: courseCode._id, isModerated: true };
        const [fbQuestions, fbTotal] = await Promise.all([
          Question.find(fallbackQuery).skip(skip).limit(limit),
          Question.countDocuments(fallbackQuery),
        ]);

        if (fbQuestions.length > 0) {
          return {
            data: fbQuestions,
            pagination: {
              total: fbTotal,
              page,
              limit,
              totalPages: Math.ceil(fbTotal / limit),
            },
          };
        }
      }
      // If still nothing
      // We return empty structure rather than error for pagination usually, but keeping existing error behavior slightly adapted
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    return {
      data: questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

async function getCourseQuestions(
  courseId: string,
  query: IPagination = { page: 1, limit: 10 }
): Promise<PaginatedResult<IQuestion>> {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find({ courseId }).skip(skip).limit(limit),
      Question.countDocuments({ courseId }),
    ]);

    if (!questions) {
      throw new Error("Course Questions not found");
    }

    return {
      data: questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getUncheckedQuestions(
  courseId: string,
  query: IPagination = { page: 1, limit: 10 }
): Promise<PaginatedResult<IQuestion>> {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      Question.find({
        courseId,
        isModerated: { $ne: true },
      })
        .skip(skip)
        .limit(limit),
      Question.countDocuments({
        courseId,
        isModerated: { $ne: true },
      }),
    ]);

    if (!questions) {
      throw new Error("Course Questions not found");
    }

    return {
      data: questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    const preparedQuestions = [];
    for (const question of questionArray) {
      const existingQuestion = await Question.findOne({
        courseId: question.courseId || courseId,
        question: question.question,
        type: question.type,
      });

      if (!existingQuestion) {
        preparedQuestions.push({
          ...question,
          courseId: question.courseId || courseId,
          author: _id,
        });
      }
    }

    const insertedQuestions = await Question.insertMany(preparedQuestions);

    return insertedQuestions;
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

    const updateResult = await Question.updateMany(
      { _id: { $in: questionIds } },
      {
        $set: {
          isModerated: true,
          moderatedBy: user._id,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("No questions found to moderate");
    }

    const moderatedQuestions = await Question.find({
      _id: { $in: questionIds },
    });

    const uniqueCourseIds = moderatedQuestions.map(
      (question) => question.courseId
    );

    const courses = await Course.find({ _id: { $in: uniqueCourseIds } });

    for (const course of courses) {
      const uniqueLectures = new Set(
        (await Question.find({ courseId: course._id })).map(
          (q) => q.lectureNumber
        )
      ).size;

      await Course.updateOne(
        { _id: course._id },
        {
          $inc: { approvedQuestionsCount: 1 },
          $set: { numberOfLectures: uniqueLectures },
        }
      );
    }

    const userModeratedQuestions = await Question.find({
      moderatedBy: user._id,
    });

    const moderatedCount = userModeratedQuestions.length;

    if (user.role !== "admin" && moderatedCount > 5) {
      const moddedCount = moderatedCount % 5;

      if (moddedCount === 0) {
        const freeAccessBonus = 1;

        if (user.role !== "moderator") {
          await User.findByIdAndUpdate(user._id, {
            $set: { role: "moderator" },
          });
        }

        await User.findByIdAndUpdate(user._id, {
          $set: { hasFreeAccess: true },
          $inc: { freeAccessCount: freeAccessBonus },
        });
      }
    }

    return updateResult;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function approveAllByModerator(courseId: string, moderator: string) {
  try {
    const user = await findUserByUsername(moderator);
    if (!user) {
      throw new Error("Your account does not exist");
    }

    const unmoderatedQuestions = await Question.find({
      courseId: courseId,
      isModerated: { $ne: true },
    });

    if (unmoderatedQuestions.length === 0) {
      throw new Error("No unmoderated questions found for this course");
    }

    const questionIds = unmoderatedQuestions.map((q) => q._id);

    const updateResult = await Question.updateMany(
      { _id: { $in: questionIds } },
      {
        $set: {
          isModerated: true,
          moderatedBy: user._id,
        },
      }
    );

    const numberOfLectures = new Set(
      (await Question.find({ courseId })).map((q) => q.lectureNumber)
    ).size;

    await Course.findByIdAndUpdate(courseId, {
      $inc: { approvedQuestionsCount: updateResult.modifiedCount },
      $set: { numberOfLectures: numberOfLectures },
    });

    const userModeratedQuestions = await Question.find({
      moderatedBy: user._id,
    });

    const moderatedCount = userModeratedQuestions.length;

    if (user.role !== "admin" && moderatedCount > 5) {
      const moddedCount = moderatedCount % 5;

      if (moddedCount === 0) {
        const freeAccessBonus = 1;

        if (user.role !== "moderator") {
          await User.findByIdAndUpdate(user._id, {
            $set: { role: "moderator" },
          });
        }

        await User.findByIdAndUpdate(user._id, {
          $set: { hasFreeAccess: true },
          $inc: { freeAccessCount: freeAccessBonus },
        });
      }
    }

    return updateResult;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function batchCreateQuestionsAI(
  questions: Partial<IQuestion> | Partial<IQuestion>[],
  courseId?: string
) {
  try {
    if (courseId && !isValidObjectId(courseId)) {
      throw new Error(`Invalid course ID format: ${courseId}`);
    }

    if (courseId) {
      const isValidCourse = await findCourseById(courseId);
      if (!isValidCourse) {
        throw new Error("Course does not exist");
      }
    }

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

    const preparedQuestions = [];
    for (const question of questionArray) {
      const existingQuestion = await Question.findOne({
        courseId: question.courseId || courseId,
        question: question.question,
        type: question.type,
      });

      if (!existingQuestion) {
        preparedQuestions.push({
          ...question,
          courseId: question.courseId || courseId,
          author: question.author,
        });
      }
    }

    const insertedQuestions = await Question.insertMany(preparedQuestions);

    return insertedQuestions;
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
  approveAllByModerator,
  batchCreateQuestionsAI,
};
