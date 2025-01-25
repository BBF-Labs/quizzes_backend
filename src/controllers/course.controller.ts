import { Course } from "../models";
import { ICourse } from "../interfaces";

async function isCourseValid(prop: { courseId?: string; courseCode?: string }) {
  const course = await Course.findOne({
    $or: [{ code: prop.courseCode }, { _id: prop.courseId }],
  });
  return course !== null;
}

async function findCourseById(courseId: string) {
  try {
    const course = await Course.findOne({ _id: courseId });

    return course;
  } catch (err: any) {
    throw err.message;
  }
}

async function createCourse(userId: string, course: Partial<ICourse>) {
  try {
    const existingCourse = await Course.findOne({ code: course.code });
    if (existingCourse) throw new Error("Course already exists");

    const { code, ...courseDetails } = course;

    const courseCode = code?.toUpperCase();

    const newCourse = new Course({
      code: courseCode,
      createdBy: userId,
      ...courseDetails,
    });

    await newCourse.save();

    return newCourse;
  } catch (err: any) {
    throw new Error(`Error creating course: ${err.message}`);
  }
}

async function updateCourse(courseId: string, updatedCourse: Partial<ICourse>) {
  try {
    const course = await Course.findOne({ _id: courseId });
    if (!course) throw new Error("Course not found");

    const updatedCourseData = await Course.findOneAndUpdate(
      { _id: courseId },
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

    if (!courses) {
      return null;
    }

    const courseDoc = courses.map((course) => {
      if (course.isDeleted) return;

      return course;
    });

    return courseDoc;
  } catch (err: any) {
    throw new Error(`Error fetching courses: ${err.message}`);
  }
}

async function deleteCourse(courseId: string) {
  try {
    const course = await Course.findOne({ _id: courseId });
    if (!course) throw new Error("Course not found");

    await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: { isDeleted: true } }
    );

    return { message: "Course deleted successfully" };
  } catch (err: any) {
    throw new Error(`Error deleting course: ${err.message}`);
  }
}

async function findCourseByCode(courseCode: string) {
  try {
    const course = await Course.findOne({ code: courseCode.toUpperCase() });

    if (!course) {
      return null;
    }

    return course;
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
