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
  validateUserPackages,
  validateUserQuizAccess,
  getUsers,
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
  batchCreateQuestionsAI,
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
  createLinkMaterial,
} from "./material.controller";

import {
  paystackAPI,
  createPayment,
  updatePayment,
  getPaymentByReference,
  getPaymentByUserId,
  getAllPayments,
  getAllInvalidPayments,
  checkExistingPayment,
  generateReference,
  updateUserPaymentDetails,
} from "./payment.controller";

import {
  createPackage,
  updatePackage,
  getPackageDetails,
  getPackages,
  getPackageByDiscountCode,
} from "./package.controller";

import {
  saveToken,
  invalidateMultipleSessions,
  updateToken,
} from "./token.controller";

import { generateQuestions, outputSchema } from "./ai.controller";

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
  paystackAPI,
  createPayment,
  updatePayment,
  getPaymentByReference,
  getPaymentByUserId,
  getAllPayments,
  getAllInvalidPayments,
  checkExistingPayment,
  createPackage,
  updatePackage,
  getPackageDetails,
  getPackages,
  getPackageByDiscountCode,
  generateReference,
  updateUserPaymentDetails,
  validateUserPackages,
  validateUserQuizAccess,
  getUsers,
  createLinkMaterial,
  saveToken,
  invalidateMultipleSessions,
  updateToken,
  generateQuestions,
  batchCreateQuestionsAI,
  outputSchema,
};
