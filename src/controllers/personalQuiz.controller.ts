import { IPersonalQuiz, IQuestion } from "../interfaces";
import { PersonalQuiz, Question, Material, User } from "../models";
import { findUserByUsername } from "./user.controller";
import { gemini15Flash, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import { z } from "zod";

// Initialize AI client for quiz generation
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || "" })],
  model: gemini15Flash,
});

// Schema for personal quiz generation
const personalQuizOutputSchema = z.array(
  z.object({
    question: z.string().describe("The question text"),
    options: z.array(z.string()).describe("Multiple choice options"),
    answer: z.string().describe("The correct answer"),
    type: z.enum(["mcq", "fill-in", "true-false"]).describe("Question type"),
    explanation: z.string().describe("Explanation of the answer"),
    hint: z.string().describe("Hint for the question"),
  })
);

type PersonalQuizOutput = z.infer<typeof personalQuizOutputSchema>[number];

/**
 * Generate a personal quiz from user's materials
 */
async function generatePersonalQuiz(
  userId: string,
  materialIds: string[],
  quizData: {
    title: string;
    description?: string;
    courseId: string;
    questionCount: number;
    difficulty: "easy" | "medium" | "hard";
    estimatedDuration: number;
    tags: string[];
  }
): Promise<IPersonalQuiz> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check access control for premium features
    if (
      !user.isSubscribed &&
      (!user.quizCredits || user.quizCredits <= 0) &&
      (!user.hasFreeAccess ||
        !user.freeAccessCount ||
        user.freeAccessCount <= 0)
    ) {
      throw new Error("Access requires a subscription or quiz credits");
    }

    // Deduct free access count if user has free access
    if (
      user.hasFreeAccess &&
      user.freeAccessCount &&
      user.freeAccessCount > 0
    ) {
      const newFreeAccessCount = user.freeAccessCount - 1;
      const hasFreeAccess = newFreeAccessCount > 0;

      await User.updateOne(
        { username: user.username },
        { freeAccessCount: newFreeAccessCount, hasFreeAccess }
      );
    }

    // Verify user has access to all materials
    const materials = await Material.find({
      _id: { $in: materialIds },
      $or: [{ uploadedBy: user._id }, { courseId: quizData.courseId }],
    });

    if (materials.length !== materialIds.length) {
      throw new Error("Access denied to some materials");
    }

    // Generate questions using AI
    const materialTitles = materials.map((m) => m.title).join(", ");
    const prompt = `Generate ${quizData.questionCount} quiz questions from the following educational materials.
    Focus on key concepts and important information.
    
    Materials: ${materialTitles}
    Difficulty: ${quizData.difficulty}
    
    Generate questions that are:
    - Clear and well-structured
    - Appropriate for the specified difficulty level
    - Cover different aspects of the material
    - Include helpful hints and explanations
    
    Return as JSON array with question, options, answer, type, explanation, and hint fields.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: personalQuizOutputSchema },
    });

    if (!output || output.length === 0) {
      throw new Error("Failed to generate quiz questions");
    }

    // Create question documents
    const questions = await Promise.all(
      output.map(async (questionData) => {
        const question = new Question({
          courseId: quizData.courseId,
          question: questionData.question,
          options: questionData.options,
          answer: questionData.answer,
          type: questionData.type,
          explanation: questionData.explanation,
          hint: questionData.hint,
          author: user._id,
          isModerated: true, // User-generated questions are pre-approved
          moderatedBy: user._id,
        });

        return await question.save();
      })
    );

    // Create personal quiz
    const personalQuiz = new PersonalQuiz({
      title: quizData.title,
      description: quizData.description,
      courseId: quizData.courseId,
      questions: questions.map((q) => q._id),
      createdBy: user._id,
      isPublic: false,
      isPublished: false,
      settings: {
        showHints: true,
        showExplanations: true,
        randomizeQuestions: false,
        allowRetakes: true,
        passingScore: 70,
      },
      tags: quizData.tags,
      difficulty: quizData.difficulty,
      estimatedDuration: quizData.estimatedDuration,
      completionCount: 0,
      averageScore: 0,
    });

    const savedQuiz = await personalQuiz.save();
    return savedQuiz;
  } catch (error: any) {
    console.error("Error generating personal quiz:", error);
    throw new Error(error.message || "Failed to generate personal quiz");
  }
}

/**
 * Get user's personal quizzes
 */
async function getUserPersonalQuizzes(
  username: string,
  courseId?: string
): Promise<IPersonalQuiz[]> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const query: any = { createdBy: user._id };

    if (courseId) {
      query.courseId = courseId;
    }

    const quizzes = await PersonalQuiz.find(query)
      .populate("courseId", "code title")
      .populate("questions", "question type")
      .sort({ lastModified: -1 });

    return quizzes;
  } catch (error: any) {
    console.error("Error fetching user personal quizzes:", error);
    throw new Error(error.message || "Failed to fetch personal quizzes");
  }
}

/**
 * Get personal quiz by ID with full details
 */
async function getPersonalQuizById(
  username: string,
  quizId: string
): Promise<IPersonalQuiz | null> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const quiz = await PersonalQuiz.findOne({
      _id: quizId,
      createdBy: user._id,
    })
      .populate("courseId", "code title")
      .populate({
        path: "questions",
        select: "question options type hint explanation",
      });

    return quiz;
  } catch (error: any) {
    console.error("Error fetching personal quiz:", error);
    return null;
  }
}

/**
 * Update personal quiz
 */
async function updatePersonalQuiz(
  username: string,
  quizId: string,
  updateData: Partial<IPersonalQuiz>
): Promise<IPersonalQuiz> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const quiz = await PersonalQuiz.findOneAndUpdate(
      { _id: quizId, createdBy: user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!quiz) {
      throw new Error("Quiz not found or access denied");
    }

    return quiz;
  } catch (error: any) {
    console.error("Error updating personal quiz:", error);
    throw new Error(error.message || "Failed to update personal quiz");
  }
}

/**
 * Share personal quiz (make public and generate share token)
 */
async function sharePersonalQuiz(
  username: string,
  quizId: string
): Promise<{ shareUrl: string }> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const quiz = await PersonalQuiz.findOneAndUpdate(
      { _id: quizId, createdBy: user._id },
      { isPublic: true, isPublished: true },
      { new: true, runValidators: true }
    );

    if (!quiz) {
      throw new Error("Quiz not found or access denied");
    }

    // Generate share URL
    const shareUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/quizzes/shared/${quiz.shareToken}`;

    return { shareUrl };
  } catch (error: any) {
    console.error("Error sharing personal quiz:", error);
    throw new Error(error.message || "Failed to share personal quiz");
  }
}

/**
 * Get shared quiz by token
 */
async function getSharedQuizByToken(
  shareToken: string
): Promise<IPersonalQuiz | null> {
  try {
    const quiz = await PersonalQuiz.findOne({
      shareToken,
      isPublic: true,
      isPublished: true,
      shareExpiry: { $gt: new Date() },
    })
      .populate("courseId", "code title")
      .populate({
        path: "questions",
        select: "question options type hint",
      });

    return quiz;
  } catch (error: any) {
    console.error("Error fetching shared quiz:", error);
    return null;
  }
}

/**
 * Delete personal quiz
 */
async function deletePersonalQuiz(
  username: string,
  quizId: string
): Promise<void> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const result = await PersonalQuiz.deleteOne({
      _id: quizId,
      createdBy: user._id,
    });

    if (result.deletedCount === 0) {
      throw new Error("Quiz not found or access denied");
    }
  } catch (error: any) {
    console.error("Error deleting personal quiz:", error);
    throw new Error(error.message || "Failed to delete personal quiz");
  }
}

export {
  generatePersonalQuiz,
  getUserPersonalQuizzes,
  getPersonalQuizById,
  updatePersonalQuiz,
  sharePersonalQuiz,
  getSharedQuizByToken,
  deletePersonalQuiz,
};
