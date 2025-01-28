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
  approveAllByModerator,
} from "./question.controller";

import {
  getQuizQuestions,
  getCourseQuizQuestions,
  batchCreateQuizQuestions,
  updateQuizQuestion,
  getFullQuizInformation,
} from "./questions.controller";

import {
  createProgress,
  getUserProgress,
  getUserProgressByCourseId,
  updateUserProgress,
} from "./progress.controller";

import {
  uploadMaterial,
  getMaterials,
  getUserMaterials,
  getCourseMaterials,
} from "./material.controller";

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
  batchCreateQuizQuestions,
  updateQuizQuestion,
  getFullQuizInformation,
  approveAllByModerator,
  createProgress,
  getUserProgress,
  getUserProgressByCourseId,
  updateUserProgress,
  uploadMaterial,
  getMaterials,
  getUserMaterials,
  getCourseMaterials,
};
