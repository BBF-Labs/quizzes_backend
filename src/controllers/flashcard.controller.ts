import { IFlashcard, IMaterial } from "../interfaces";
import { Flashcard, Material, User } from "../models";
import { extractText } from "./ai.controller";
import { findUserByUsername, validateUserAIAccess } from "./user.controller";
import { gemini20Flash, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import { z } from "zod";

// Initialize AI client for flashcard generation
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || "" })],
  model: gemini20Flash,
});

// Schema for flashcard generation
const flashcardOutputSchema = z.array(
  z.object({
    front: z
      .string()
      .describe("The question or concept on the front of the flashcard"),
    back: z
      .string()
      .describe("The answer or explanation on the back of the flashcard"),
    tags: z.array(z.string()).describe("Relevant tags for categorization"),
    difficulty: z
      .enum(["easy", "medium", "hard"])
      .describe("Difficulty level of the concept"),
  })
);

type FlashcardOutput = z.infer<typeof flashcardOutputSchema>[number];

/**
 * Generate flashcards from user's uploaded material
 */
async function generateFlashcards(
  userId: string,
  materialId: string,
  count: number = 10
): Promise<IFlashcard[]> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await validateUserAIAccess(user.username);

    const material = await Material.findById(materialId);
    if (!material) {
      throw new Error("Material not found");
    }

    // Check if user owns this material or has access to the course
    if (
      material.uploadedBy.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new Error("Access denied to this material");
    }

    const extractedText = await extractText(material.url, material.type);

    // Generate flashcards using AI
    const prompt = `Generate ${count} flashcards from the following educational material. 
    Each flashcard should have a clear front (question/concept) and back (answer/explanation).
    Focus on key concepts, definitions, and important information.
    
    Material: ${material.title}
    Type: ${material.type}
    Reference: ${material.questionRefType}
    Extracted Text: ${extractedText}
    
    Generate flashcards that are:
    - Clear and concise
    - Educational and informative
    - Appropriate difficulty level
    - Well-tagged for organization
    
    Return as JSON array with front, back, tags, and difficulty fields.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: flashcardOutputSchema },
    });

    if (!output || output.length === 0) {
      throw new Error("Failed to generate flashcards");
    }

    // Create flashcard documents
    const flashcards = await Promise.all(
      output.map(async (flashcardData) => {
        const flashcard = new Flashcard({
          courseId: material.courseId,
          materialId: material._id,
          front: flashcardData.front,
          back: flashcardData.back,
          lectureNumber: material.questionRefType,
          createdBy: user._id,
          isPublic: false, // Default to private
          tags: flashcardData.tags,
          difficulty: flashcardData.difficulty,
          reviewCount: 0,
          masteryLevel: 0,
        });

        return await flashcard.save();
      })
    );

    return flashcards;
  } catch (error: any) {
    console.error("Error generating flashcards:", error);
    throw new Error(error.message || "Failed to generate flashcards");
  }
}

/**
 * Get user's flashcards
 */
async function getUserFlashcards(
  username: string,
  courseId?: string,
  materialId?: string
): Promise<IFlashcard[]> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const query: any = { createdBy: user._id };

    if (courseId) {
      query.courseId = courseId;
    }

    if (materialId) {
      query.materialId = materialId;
    }

    const flashcards = await Flashcard.find(query)
      .populate("courseId", "code title")
      .populate("materialId", "title questionRefType")
      .sort({ createdAt: -1 });

    return flashcards;
  } catch (error: any) {
    console.error("Error fetching user flashcards:", error);
    throw new Error(error.message || "Failed to fetch flashcards");
  }
}

/**
 * Update flashcard (for review tracking)
 */
async function updateFlashcard(
  username: string,
  flashcardId: string,
  updateData: Partial<IFlashcard>
): Promise<IFlashcard> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    // First, find the flashcard to check if it exists and user has access
    const existingFlashcard = await Flashcard.findById(flashcardId);
    if (!existingFlashcard) {
      throw new Error("Flashcard not found");
    }

    // Check if user has access to this flashcard
    if (existingFlashcard.createdBy.toString() !== user._id.toString()) {
      throw new Error("Access denied to this flashcard");
    }

    // Prepare update data, ensuring we don't override required fields
    const safeUpdateData = {
      ...updateData,
      lastReviewed: new Date(),
      // Ensure we don't override required fields
      courseId: existingFlashcard.courseId,
      materialId: existingFlashcard.materialId,
      front: existingFlashcard.front,
      back: existingFlashcard.back,
      lectureNumber: existingFlashcard.lectureNumber,
      createdBy: existingFlashcard.createdBy,
    };

    const flashcard = await Flashcard.findByIdAndUpdate(
      flashcardId,
      safeUpdateData,
      { new: true, runValidators: true }
    );

    if (!flashcard) {
      throw new Error("Failed to update flashcard");
    }

    return flashcard;
  } catch (error: any) {
    console.error("Error updating flashcard:", error);

    // Check for specific MongoDB errors
    if (error.code === 40) {
      console.error("MongoDB ConflictingUpdateOperators error detected");
      console.error(
        "This usually happens when multiple update operations conflict"
      );
      console.error("Update data received:", updateData);
    }

    throw new Error(error.message || "Failed to update flashcard");
  }
}

/**
 * Share flashcard (make public and generate share token)
 */
async function shareFlashcard(
  username: string,
  flashcardId: string
): Promise<{ shareUrl: string }> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: flashcardId, createdBy: user._id },
      { isPublic: true },
      { new: true, runValidators: true }
    );

    if (!flashcard) {
      throw new Error("Flashcard not found or access denied");
    }

    // Generate share URL
    const shareUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/flashcards/shared/${flashcard._id}`;

    return { shareUrl };
  } catch (error: any) {
    console.error("Error sharing flashcard:", error);
    throw new Error(error.message || "Failed to share flashcard");
  }
}

/**
 * Get shared flashcard by ID
 */
async function getSharedFlashcard(
  flashcardId: string
): Promise<IFlashcard | null> {
  try {
    const flashcard = await Flashcard.findById(flashcardId)
      .populate("courseId", "code title")
      .populate("materialId", "title questionRefType")
      .populate("createdBy", "username name");

    if (!flashcard || !flashcard.isPublic) {
      return null;
    }

    return flashcard;
  } catch (error: any) {
    console.error("Error fetching shared flashcard:", error);
    return null;
  }
}

/**
 * Delete user's flashcard
 */
async function deleteFlashcard(
  username: string,
  flashcardId: string
): Promise<void> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const result = await Flashcard.deleteOne({
      _id: flashcardId,
      createdBy: user._id,
    });

    if (result.deletedCount === 0) {
      throw new Error("Flashcard not found or access denied");
    }
  } catch (error: any) {
    console.error("Error deleting flashcard:", error);
    throw new Error(error.message || "Failed to delete flashcard");
  }
}

/**
 * Get user's flashcard statistics
 */
async function getUserFlashcardStats(username: string): Promise<{
  totalFlashcards: number;
  totalReviews: number;
  averageMasteryLevel: number;
  difficultyBreakdown: { easy: number; medium: number; hard: number };
  recentActivity: Date[];
}> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const flashcards = await Flashcard.find({ createdBy: user._id });

    const totalFlashcards = flashcards.length;
    const totalReviews = flashcards.reduce(
      (sum, card) => sum + card.reviewCount,
      0
    );
    const averageMasteryLevel =
      totalFlashcards > 0
        ? flashcards.reduce((sum, card) => sum + card.masteryLevel, 0) /
          totalFlashcards
        : 0;

    const difficultyBreakdown = {
      easy: flashcards.filter((card) => card.difficulty === "easy").length,
      medium: flashcards.filter((card) => card.difficulty === "medium").length,
      hard: flashcards.filter((card) => card.difficulty === "hard").length,
    };

    const recentActivity = flashcards
      .filter((card) => card.lastReviewed)
      .map((card) => card.lastReviewed!)
      .sort((a, b) => b.getTime() - a.getTime())
      .slice(0, 10);

    return {
      totalFlashcards,
      totalReviews,
      averageMasteryLevel: Math.round(averageMasteryLevel * 100) / 100,
      difficultyBreakdown,
      recentActivity,
    };
  } catch (error: any) {
    console.error("Error fetching flashcard stats:", error);
    throw new Error(error.message || "Failed to fetch flashcard statistics");
  }
}

/**
 * Get flashcards by user and course with enhanced filtering
 */
async function getUserFlashcardsByCourse(
  username: string,
  courseId: string,
  filters?: {
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    masteryLevel?: { min: number; max: number };
    lastReviewed?: { days: number };
  }
): Promise<IFlashcard[]> {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    let query: any = {
      createdBy: user._id,
      courseId: courseId,
    };

    // Apply filters
    if (filters?.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters?.masteryLevel) {
      query.masteryLevel = {
        $gte: filters.masteryLevel.min,
        $lte: filters.masteryLevel.max,
      };
    }

    if (filters?.lastReviewed) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.lastReviewed.days);
      query.lastReviewed = { $lt: cutoffDate };
    }

    const flashcards = await Flashcard.find(query)
      .populate("courseId", "code title")
      .populate("materialId", "title questionRefType")
      .sort({ lastReviewed: 1, createdAt: -1 }); // Prioritize unreviewed cards

    return flashcards;
  } catch (error: any) {
    console.error("Error fetching user flashcards by course:", error);
    throw new Error(error.message || "Failed to fetch flashcards");
  }
}

export {
  generateFlashcards,
  getUserFlashcards,
  updateFlashcard,
  shareFlashcard,
  getSharedFlashcard,
  deleteFlashcard,
  getUserFlashcardStats,
  getUserFlashcardsByCourse,
};
