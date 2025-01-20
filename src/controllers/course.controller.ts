import { Course } from "../models";
import { ICourse } from "../interfaces";
import { v4 as uuidv4 } from "uuid";

async function isCourseValid(prop: { courseId?: string; courseCode?: string }) {
  const course = await Course.findOne({
    $or: [{ code: prop.courseCode }, { id: prop.courseId }],
  });
  return course !== null;
}

async function generateUUID() {
  let id = uuidv4();
  while (await isCourseValid({ courseId: id })) {
    id = uuidv4();
  }
  return id;
}

async function findCourseById(courseId: string) {
  try {
    const course = await Course.findOne({ id: courseId });

    if (!course) {
      return null;
    }

    const { _id, ...courseDoc } = course.toObject();

    return courseDoc;
  } catch (err: any) {
    throw err.message;
  }
}

async function createCourse(userId: string, course: Partial<ICourse>) {
  try {
    const existingCourse = await Course.findOne({ code: course.code });
    if (existingCourse) throw new Error("Course already exists");

    const id = await generateUUID();
    const { code, ...courseDetails } = course;

    const courseCode = code?.toUpperCase();

    const newCourse = new Course({
      id,
      code: courseCode,
      ...courseDetails,
    });

    await newCourse.save();
    const { _id, ...courseDoc } = newCourse.toObject();
    return courseDoc;
  } catch (err: any) {
    throw new Error(`Error creating course: ${err.message}`);
  }
}

async function updateCourse(courseId: string, updatedCourse: Partial<ICourse>) {
  try {
    const course = await Course.findOne({ id: courseId });
    if (!course) throw new Error("Course not found");

    const updatedCourseData = await Course.findOneAndUpdate(
      { id: courseId },
      { $set: updatedCourse },
      { new: true }
    );

    if (!updatedCourseData) {
      throw new Error("Course not found");
    }

    const { _id, ...courseDoc } = updatedCourseData.toObject();
    return courseDoc;
  } catch (err: any) {
    throw new Error(`Error updating course: ${err.message}`);
  }
}

async function getAllCourses() {
  try {
    const courses = await Course.find({});
    return courses;
  } catch (err: any) {
    throw new Error(`Error fetching courses: ${err.message}`);
  }
}

async function deleteCourse(courseId: string) {
  try {
    const course = await Course.findOne({ id: courseId });
    if (!course) throw new Error("Course not found");

    await Course.findOneAndUpdate(
      { id: courseId },
      { $set: { isDeleted: true } }
    );

    return { message: "Course deleted successfully" };
  } catch (err: any) {
    throw new Error(`Error deleting course: ${err.message}`);
  }
}

async function findCourseByCode(courseCode: string) {
  try {
    const course = await Course.findOne({ code: courseCode });

    if (!course) {
      return null;
    }

    const { _id, ...courseDoc } = course.toObject();

    return courseDoc;
  } catch (err: any) {
    throw err.message;
  }
}

async function getUserCourses(userId: string) {
  try {
    const courses = await Course.find({ students: userId });

    if (!courses) {
      return null;
    }

    return courses;
  } catch (err: any) {
    throw err.message;
  }
}

export {
  createCourse,
  updateCourse,
  getAllCourses,
  deleteCourse,
  findCourseById,
  findCourseByCode,
  getUserCourses,
};
