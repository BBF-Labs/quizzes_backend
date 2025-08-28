import { Request, Response } from "express";
import { StatusCodes } from "../config";
import { Payment, User, Question } from "../models";
import { findUserByUsername } from "./user.controller";
import { genkit, z } from "genkit";
import { gemini15Flash, googleAI, gemini20Flash } from "@genkit-ai/googleai";
import { Config } from "../config";

interface AIQuestionRequest {
  question: string;
  questionId?: string;
  flashcardId?: string;
  courseId?: string;
}

interface AIResponse {
  answer: string;
  explanation?: string;
  relatedTopics?: string[];
  confidence: number;
}

const ai = genkit({
  plugins: [googleAI({ apiKey: Config.GOOGLE_GENAI_API_KEY })],
  model: gemini20Flash,
});

export const aiAssistantController = {
  // Ask AI a question during quiz
  async askQuestion(req: Request, res: Response) {
    try {
      const { question, questionId, flashcardId, courseId }: AIQuestionRequest =
        req.body;
      const user = req.user;
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userDoc = await findUserByUsername(user.username);
      if (!userDoc) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
      }

      const userId = userDoc._id.toString();

      // Access control: Check if user has AI access
      const hasAccess = await checkAIAccess(user);
      if (!hasAccess) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "AI assistance requires a subscription or quiz credits",
          required: "subscription_or_credits",
        });
      }

      if (!question || question.trim().length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Question is required",
        });
      }

      // Build context for AI - include question or flashcard context if provided
      let fullContext = `Question: ${question}`;

      if (questionId) {
        const questionDoc = await Question.findById(questionId);
        if (questionDoc) {
          fullContext += `\n\nOriginal Question Context: ${
            questionDoc.question
          }\n\nOptions: ${questionDoc.options?.join(", ") || "N/A"}`;
        }
      }

      if (flashcardId) {
        // Import Flashcard model if not already imported
        const { Flashcard } = await import("../models");
        const flashcardDoc = await Flashcard.findById(flashcardId);
        if (flashcardDoc) {
          fullContext += `\n\nFlashcard Context:\nQuestion: ${
            flashcardDoc.front
          }\nAnswer: ${flashcardDoc.back}\nTags: ${
            flashcardDoc.tags?.join(", ") || "N/A"
          }\nDifficulty: ${flashcardDoc.difficulty}`;
        }
      }

      // Generate AI response using Genkit
      const aiResponse = await generateAIResponse(fullContext, {
        questionId: questionId || "general",
        userId,
      });

      // Log AI usage for analytics
      await logAIUsage(userId, {
        question,
        questionId: questionId || "general",
        tokensUsed: aiResponse.tokensUsed || 0,
      });

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          answer: aiResponse.answer,
          explanation: aiResponse.explanation,
          relatedTopics: aiResponse.relatedTopics,
          confidence: aiResponse.confidence,
          usage: {
            tokensUsed: aiResponse.tokensUsed,
            remainingCredits: userDoc.quizCredits || 0,
          },
        },
      });
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to process AI question",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Get AI usage statistics for user
  async getUsageStats(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userDoc = await findUserByUsername(user.username);
      if (!userDoc) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
      }

      // Get AI usage stats
      const stats = await getAIUsageStats(userDoc._id.toString());
      const expiresAt = userDoc.isSubscribed
        ? await Payment.findOne({
            userId: userDoc._id,
            status: "active",
          })
        : undefined;

      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          subscription: {
            type: userDoc.accessType,
            status: userDoc.isSubscribed ? "active" : "inactive",
            expiresAt: expiresAt?.endsAt,
          },
          credits: {
            available: userDoc.quizCredits || 0,
            used: stats.totalTokens || 0,
            limit: userDoc.accessType === "duration" ? 3000 : 1000,
            lastUsed: stats.lastUsed,
          },
        },
      });
    } catch (error) {
      console.error("AI Usage Stats Error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to get usage statistics",
      });
    }
  },
};

// Helper function to check AI access
async function checkAIAccess(user: any): Promise<boolean> {
  if (user.role === "admin") {
    return true;
  }

  // Check if user has active subscription
  if (
    user.subscription?.status === "active" &&
    user.subscription?.expiresAt > new Date()
  ) {
    return true;
  }

  // Check if user has quiz credits
  if (user.quizCredits && user.quizCredits > 0) {
    return true;
  }

  // Check if user has free tier access (limited)
  if (user.freeTierAccess && user.freeTierAccess.aiQuestionsRemaining > 0) {
    return true;
  }

  return false;
}

// Helper function to generate AI response
async function generateAIResponse(
  context: string,
  metadata: { questionId: string | "general"; userId: string }
): Promise<AIResponse & { tokensUsed?: number }> {
  try {
    const prompt = `
     You are BetaForge's Labs AI Assistant.
 You are an AI tutor helping a student during a quiz. Provide helpful, educational responses that guide the student without giving away the answer directly.
 
 Context: ${context}
 
 Instructions:
 1. Provide a clear, educational explanation using markdown formatting
 2. Use **bold** for important concepts, *italic* for emphasis
 3. Use bullet points (- or *) for lists
 4. Use \`code\` for technical terms or code snippets
 5. Use ### for section headers when appropriate
 6. Include relevant concepts and examples
 7. Guide the student toward understanding
 8. Don't give the exact answer if it's a quiz question
 9. Be encouraging and supportive
 
 Response in markdown format:`;

    const { text: response } = await ai.generate(prompt);

    // Parse and structure the response
    const answer =
      response || "I'm sorry, I couldn't generate a response at this time.";

    // Extract explanation and related topics (you can enhance this parsing)
    const explanation =
      answer.length > 100 ? answer.substring(0, 100) + "..." : answer;
    const relatedTopics = extractRelatedTopics(answer);

    return {
      answer,
      explanation,
      relatedTopics,
      confidence: 0.85,
      tokensUsed: 0,
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      answer:
        "I'm sorry, I'm having trouble processing your question right now. Please try again later.",
      explanation: "AI service temporarily unavailable",
      relatedTopics: [],
      confidence: 0.0,
    };
  }
}

// Helper function to extract related topics
function extractRelatedTopics(text: string): string[] {
  // Simple keyword extraction - you can enhance this with NLP
  const commonTopics = [
    "mathematics",
    "science",
    "history",
    "literature",
    "programming",
    "physics",
    "chemistry",
    "biology",
    "economics",
    "philosophy",
  ];

  const foundTopics = commonTopics.filter((topic) =>
    text.toLowerCase().includes(topic.toLowerCase())
  );

  return foundTopics.slice(0, 3); // Return max 3 topics
}

// Helper function to log AI usage
async function logAIUsage(
  userId: string,
  usage: {
    question: string;
    questionId: string | "general";
    tokensUsed: number;
  }
) {
  try {
    // Update user's AI usage stats
    await User.findByIdAndUpdate(userId, {
      $inc: {
        "aiUsage.totalQuestions": 1,
        "aiUsage.totalTokens": usage.tokensUsed || 0,
      },
      $set: { "aiUsage.lastUsed": new Date() },
    });

    // If user has credits, deduct them
    if (usage.tokensUsed && usage.tokensUsed > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { quizCredits: -Math.ceil(usage.tokensUsed / 10) }, // 1 credit per 10 tokens
      });
    }
  } catch (error) {
    console.error("Failed to log AI usage:", error);
  }
}

// Helper function to get AI usage statistics
async function getAIUsageStats(userId: string) {
  try {
    const user = await User.findById(userId);
    if (!user) return {};

    return {
      totalQuestions: 0,
      totalTokens: 0,
      thisMonth: 0,
      lastUsed: new Date(),
    };
  } catch (error) {
    console.error("Failed to get AI usage stats:", error);
    return {};
  }
}
