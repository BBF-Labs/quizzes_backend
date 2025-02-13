import { IProgress } from "../interfaces";
import { Course, Progress, User } from "../models";
import { findUserByUsername } from "./user.controller";

async function createProgress(
  username: string,
  progressData: Partial<IProgress>
) {
  try {
    if (!progressData) {
      throw new Error("Course code and quiz ID are required");
    }

    const user = await findUserByUsername(username);

    if (!user) {
      throw new Error("User not found");
    }

    const existingProgress = await Progress.findOneAndUpdate(
      {
        userId: user._id,
        courseId: progressData.courseId,
        quizId: progressData.quizId,
      },
      {
        $addToSet: { ...progressData },
      },
      {
        new: true,
        upsert: true,
      }
    );

    await Course.updateOne(
      { courseId: progressData.courseId },
      { $addToSet: { students: user._id } }
    );

    if (user.accessType !== "quiz") {
      await User.updateOne(
        { _id: user._id },
        { $addToSet: { courses: progressData.courseId } }
      );
    }

    return existingProgress;
  } catch (error) {
    console.error("Error creating/updating progress:", error);
    throw error;
  }
}

async function getUserProgressByCourseId(username: string, courseCode: string) {
  try {
    const user = await findUserByUsername(username);

    if (!user) {
      throw new Error("User not found");
    }

    const progresses = await Progress.find({
      userId: user._id,
      courseCode,
    }).populate("quizId");

    return progresses;
  } catch (error) {
    console.error("Error fetching user progress:", error);
    throw error;
  }
}

async function getUserProgress(username: string) {
  try {
    const user = await findUserByUsername(username);

    if (!user) {
      throw new Error("User not found");
    }

    const progresses = await Progress.find({ userId: user._id })
      .populate("courseCode")
      .populate("quizId");

    return progresses;
  } catch (error) {
    console.error("Error fetching user progress:", error);
    throw error;
  }
}

async function updateUserProgress(
  progressId: string,
  updateData: Partial<IProgress>
) {
  try {
    const updatedProgress = await Progress.findByIdAndUpdate(
      {
        progressId,
      },
      {
        $addToSet: { ...updateData },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return updatedProgress;
  } catch (error) {
    console.error("Error updating user progress:", error);
    throw error;
  }
}

export {
  createProgress,
  getUserProgress,
  getUserProgressByCourseId,
  updateUserProgress,
};
