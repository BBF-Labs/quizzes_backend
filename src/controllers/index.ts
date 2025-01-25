import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
} from "./auth.controller";

import {
  createUser,
  updateUser,
  deleteUser,
  findUserByEmail,
  findUserByUsername,
  getUserRole,
  findUserById,
} from "./user.controller";

import {
  createCourse,
  updateCourse,
  getAllCourses,
  deleteCourse,
  findCourseById,
  findCourseByCode,
  getUserCourses,
} from "./course.controller";

import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  getCourseQuestions,
  getUncheckedQuestions,
  getQuestionByCourseCode,
  batchCreateQuestions,
  batchModerateQuestions,
} from "./question.controller";

import {
  getQuizQuestions,
  getCourseQuizQuestions,
  createQuizQuestions,
} from "./questions.controller";

export {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
  createUser,
  updateUser,
  deleteUser,
  findUserByEmail,
  findUserByUsername,
  getUserRole,
  findUserById,
  createCourse,
  updateCourse,
  getAllCourses,
  deleteCourse,
  findCourseById,
  findCourseByCode,
  getUserCourses,
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  getCourseQuestions,
  getUncheckedQuestions,
  getQuestionByCourseCode,
  batchCreateQuestions,
  batchModerateQuestions,
  getQuizQuestions,
  getCourseQuizQuestions,
  createQuizQuestions,
};
