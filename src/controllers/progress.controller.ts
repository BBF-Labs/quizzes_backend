import { IProgress } from "../interfaces";
import { Progress } from "../models";

async function createProgress(
  userId: string,
  progressData: Partial<IProgress>
) {
  try {
    if (!progressData.courseCode || !progressData.quizId) {
      throw new Error("Course code and quiz ID are required");
    }

    const existingProgress = await Progress.findOneAndUpdate(
      {
        userId,
        courseCode: progressData.courseCode,
        quizId: progressData.quizId,
      },
      {
        ...progressData,
        completedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    return existingProgress;
  } catch (error) {
    console.error("Error creating/updating progress:", error);
    throw error;
  }
}

async function getUserProgressByCourseId(userId: string, courseCode: string) {
  try {
    const progresses = await Progress.find({
      userId,
      courseCode,
    }).populate("quizId");

    return progresses;
  } catch (error) {
    console.error("Error fetching user progress:", error);
    throw error;
  }
}

async function getUserProgress(userId: string) {
  try {
    const progresses = await Progress.find({ userId })
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
      progressId,
      updateData,
      { new: true }
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
