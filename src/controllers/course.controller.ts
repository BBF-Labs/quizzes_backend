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
    if (!course.code) {
      throw new Error("Course code is required");
    }

    const codeRegex = /^([A-Za-z]+)\s*(\d+)$/;
    const match = course.code.trim().match(codeRegex);

    if (!match) {
      throw new Error("Invalid course code format. Expected format: DCIT 101");
    }

    const [_, codeStr, codeNum] = match;
    const courseCode = `${codeStr.toUpperCase()} ${codeNum}`;

    const existingCourse = await Course.findOne({ code: courseCode });
    if (existingCourse) {
      throw new Error("Course already exists");
    }

    const semester = parseInt(codeNum) % 2 === 0 ? 2 : 1;

    const newCourse = new Course({
      semester,
      createdBy: userId,
      ...course,
      code: courseCode,
    });

    await newCourse.save();

    return { message: "Course created", course: newCourse };
  } catch (err: any) {
    throw new Error(`Error creating course: ${err.message}`);
  }
}

async function updateCourse(courseId: string, updatedCourse: Partial<ICourse>) {
  try {
    const course = await Course.findOne({ _id: courseId });
    if (!course) throw new Error("Course not found");

    if (updatedCourse.code) {
      const codeRegex = /^([A-Za-z]+)\s*(\d+)$/;
      const match = updatedCourse.code.match(codeRegex);

      if (!match) {
        throw new Error(
          "Invalid course code format. Expected format: DCIT 101"
        );
      }

      const [_, codeStr, codeNum] = match;
      const formattedCode = `${codeStr.toUpperCase()} ${codeNum}`;

      updatedCourse.code = formattedCode;
    }

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
    if (!courseCode) throw new Error("Course code is required");
    const codeRegex = /^([A-Za-z]+)\s*(\d+)$/;
    const match = courseCode.trim().match(codeRegex);

    if (!match) {
      throw new Error("Invalid course code format. Expected format: DCIT 101");
    }

    const [_, codeStr, codeNum] = match;
    const formattedCode = `${codeStr.toUpperCase()} ${codeNum}`;

    const course = await Course.findOne({ code: formattedCode });

    return course || null;
  } catch (err: any) {
    throw new Error(`Error finding course: ${err.message}`);
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
