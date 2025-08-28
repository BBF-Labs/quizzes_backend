import { Request, Response } from "express";
import { PersonalQuiz, Material, Course, User } from "../models";
import { generatePersonalQuizFromMaterial } from "../services/aiService";
import { findUserByUsername } from "./user.controller";

// Create a new personal quiz automatically from uploaded material
export const createPersonalQuiz = async (req: Request, res: Response) => {
  try {
    const { materialId, questionCount = 10 } = req.body;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate question count
    const validatedQuestionCount = Math.min(
      20,
      Math.max(1, questionCount || 10)
    );

    // Verify material exists and belongs to user
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    const userDoc = await findUserByUsername(username);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    if ((material.uploadedBy as any).toString() !== userDoc._id.toString()) {
      return res
        .status(403)
        .json({ message: "Access denied to this material" });
    }

    // Verify course exists
    const course = await Course.findById(material.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Generate complete quiz using AI service
    const generatedQuiz = await generatePersonalQuizFromMaterial(
      material,
      validatedQuestionCount
    );

    // Create personal quiz with AI-generated content
    const personalQuiz = new PersonalQuiz({
      title: generatedQuiz.title,
      description: generatedQuiz.description,
      courseId: material.courseId,
      materialId: material._id,
      createdBy: userDoc._id,
      questions: generatedQuiz.questions,
      settings: {
        timeLimit: Math.ceil(generatedQuiz.estimatedDuration * 1.2), // Add 20% buffer
        shuffleQuestions: true,
        showHints: true,
        showExplanations: true,
        allowRetakes: true,
        passingScore: 70,
      },
      stats: {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
      },
      isPublic: false,
      tags: generatedQuiz.tags,
    });

    await personalQuiz.save();

    res.status(201).json({
      message: "Personal quiz created successfully",
      quiz: personalQuiz,
    });
  } catch (error: any) {
    console.error("Error creating personal quiz:", error);

    // Handle AI generation errors specifically
    if (error.message.includes("Failed to generate personal quiz")) {
      return res.status(503).json({
        message:
          "AI service temporarily unavailable. Please try again in a few minutes.",
        error: "AI_GENERATION_FAILED",
        retryAfter: 60, // Suggest retry after 1 minute
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all personal quizzes for a user
export const getUserPersonalQuizzes = async (req: Request, res: Response) => {
  try {
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userDoc = await findUserByUsername(username);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const quizzes = await PersonalQuiz.find({ createdBy: userDoc._id })
      .populate("courseId", "code title")
      .populate("materialId", "title type")
      .sort({ createdAt: -1 });

    res.status(200).json({ quizzes });
  } catch (error) {
    console.error("Error fetching user personal quizzes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a specific personal quiz
export const getPersonalQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userDoc = await findUserByUsername(username);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const quiz = await PersonalQuiz.findById(quizId)
      .populate("courseId", "code title about")
      .populate("materialId", "title type questionRefType")
      .populate("createdBy", "name username");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if user has access to this quiz
    if (
      (quiz.createdBy as any)._id.toString() !== userDoc._id.toString() &&
      !quiz.isPublic
    ) {
      return res.status(403).json({ message: "Access denied to this quiz" });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    console.error("Error fetching personal quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a personal quiz
export const updatePersonalQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const updateData = req.body;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userDoc = await findUserByUsername(username);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const quiz = await PersonalQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if ((quiz.createdBy as any).toString() !== userDoc._id.toString()) {
      return res.status(403).json({ message: "Access denied to this quiz" });
    }

    // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "questions",
      "settings",
      "isPublic",
      "tags",
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        (quiz as any)[field] = updateData[field];
      }
    });

    await quiz.save();

    res.status(200).json({
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    console.error("Error updating personal quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a personal quiz
export const deletePersonalQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userDoc = await findUserByUsername(username);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const quiz = await PersonalQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if ((quiz.createdBy as any).toString() !== userDoc._id.toString()) {
      return res.status(403).json({ message: "Access denied to this quiz" });
    }

    await PersonalQuiz.findByIdAndDelete(quizId);

    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting personal quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Regenerate questions for a personal quiz
export const regenerateQuestions = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { questionCount = 10 } = req.body;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userDoc = await findUserByUsername(username);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const quiz = await PersonalQuiz.findById(quizId).populate("materialId");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if ((quiz.createdBy as any).toString() !== userDoc._id.toString()) {
      return res.status(403).json({ message: "Access denied to this quiz" });
    }

    // Generate new questions using AI
    const newQuiz = await generatePersonalQuizFromMaterial(
      quiz.materialId as any,
      questionCount
    );

    // Update quiz with new AI-generated content
    quiz.title = newQuiz.title;
    quiz.description = newQuiz.description;
    quiz.questions = newQuiz.questions;
    quiz.tags = newQuiz.tags;
    quiz.settings.timeLimit = Math.ceil(newQuiz.estimatedDuration * 1.2);

    await quiz.save();

    res.status(200).json({
      message: "Questions regenerated successfully",
      quiz,
    });
  } catch (error: any) {
    console.error("Error regenerating questions:", error);

    // Handle AI generation errors specifically
    if (error.message.includes("Failed to generate personal quiz")) {
      return res.status(503).json({
        message:
          "AI service temporarily unavailable. Please try again in a few minutes.",
        error: "AI_GENERATION_FAILED",
        retryAfter: 60,
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

// Get public personal quizzes
export const getPublicPersonalQuizzes = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, courseId, tags } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { isPublic: true };

    if (courseId) {
      filter.courseId = courseId;
    }

    if (tags && Array.isArray(tags)) {
      filter.tags = { $in: tags };
    }

    const quizzes = await PersonalQuiz.find(filter)
      .populate("courseId", "code title")
      .populate("materialId", "title type")
      .populate("createdBy", "name username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PersonalQuiz.countDocuments(filter);

    res.status(200).json({
      quizzes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching public personal quizzes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
