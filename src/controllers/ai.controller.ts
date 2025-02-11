import { gemini15Flash, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import axios from "axios";
import { parseOfficeAsync, OfficeParserConfig } from "officeparser";
import { z } from "zod";
import { IMaterial } from "../interfaces";
import { Config } from "../config";
import { Material } from "../models";
import Tesseract from "tesseract.js";

// Initialize AI client
const ai = genkit({
  plugins: [googleAI({ apiKey: Config.GOOGLE_GENAI_API_KEY })],
  model: gemini15Flash,
});

// Types and Schemas
const MaterialTypeEnum = z.enum([
  "pdf",
  "doc",
  "slides",
  "text",
  "img",
  "link",
]);
type MaterialType = z.infer<typeof MaterialTypeEnum>;

const QuestionTypeEnum = z.enum(["mcq", "fill-in", "true-false"]);
type QuestionType = z.infer<typeof QuestionTypeEnum>;

// Configuration
const OFFICE_PARSER_CONFIG: OfficeParserConfig = {
  newlineDelimiter: " ",
  ignoreNotes: true,
};

const QUESTION_CONFIG = {
  minQuestions: 20,
  targetQuestions: {
    min: 40,
    max: 50,
  },
  typeDistribution: {
    mcq: 0.6,
    fillIn: 0.2,
    trueFalse: 0.2,
  },
  difficultyDistribution: {
    basic: 0.4,
    intermediate: 0.3,
    advanced: 0.2,
    critical: 0.1,
  },
  authorId: "67aa146c0b3df638fe8ef06f",
} as const;

// Schemas
const inputSchema = z.object({
  fileUrl: z.string().url(),
  type: MaterialTypeEnum,
});

const outputSchema = z.array(
  z.object({
    courseId: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
    type: QuestionTypeEnum,
    explanation: z.string(),
    lectureNumber: z.string(),
    author: z.string(),
  })
);

type OutputQuestion = z.infer<typeof outputSchema>[number];

/**
 * Extracts text content from various file types
 * @param fileUrl URL of the file to process
 * @param type Type of the material
 * @returns Extracted text content
 * @throws Error if extraction fails
 */
const extractText = async (
  fileUrl: string,
  type: MaterialType
): Promise<string> => {
  try {
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 second timeout
    });
    const buffer = Buffer.from(response.data);

    switch (type) {
      case "pdf":
      case "doc":
      case "slides":
        return await parseOfficeAsync(buffer, OFFICE_PARSER_CONFIG);

      case "text":
        return buffer.toString("utf-8");

      case "img":
        const result = await Tesseract.recognize(buffer, "eng");
        if (!result.data.text) {
          throw new Error("Failed to extract text from image");
        }
        return result.data.text;

      case "link":
        throw new Error("Link type not supported for direct text extraction");

      default:
        throw new Error(`Unsupported file type: ${type}`);
    }
  } catch (error) {
    throw new Error(
      `Text extraction failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Creates the prompt for question generation
 */
const createPrompt = (
  extractedText: string,
  materialRecord: Partial<IMaterial>
): string => {
  return `Using the following interface:
interface IQuestion { 
  courseId: ${materialRecord.courseId}; 
  question: string; 
  options: string[]; 
  answer: string; 
  type: "mcq" | "fill-in" | "true-false"; 
  explanation?: string; 
  lectureNumber?: ${materialRecord.questionRefType}; 
  author: ${QUESTION_CONFIG.authorId}; 
}

${createGuidelinesSection()}

${createSpecificationsSection(materialRecord, extractedText)}`;
};

/**
 * Creates the guidelines section of the prompt
 */
const createGuidelinesSection = (): string => `
Guidelines for Question Generation:
1. Focus on conceptual understanding, avoiding superficial details
2. Ensure questions test:
   - Core concepts
   - Theoretical principles
   - Practical applications
   - Critical thinking
   - Analytical reasoning

Question Generation Rules:
- Generate minimum ${QUESTION_CONFIG.minQuestions} questions per material
- Cover breadth and depth of content
- Exclude trivial information like:
  * Course/department names
  * Credit hours
  * Lecturer details
  * Slide formatting
  * Administrative information

Question Types:
- ${QUESTION_CONFIG.typeDistribution.mcq * 100}% Multiple Choice (MCQ)
- ${QUESTION_CONFIG.typeDistribution.fillIn * 100}% Fill-in-the-Blank
- ${QUESTION_CONFIG.typeDistribution.trueFalse * 100}% True/False

Question Difficulty Distribution:
- ${QUESTION_CONFIG.difficultyDistribution.basic * 100}% Basic comprehension
- ${
  QUESTION_CONFIG.difficultyDistribution.intermediate * 100
}% Intermediate analysis
- ${QUESTION_CONFIG.difficultyDistribution.advanced * 100}% Advanced application
- ${
  QUESTION_CONFIG.difficultyDistribution.critical * 100
}% Critical thinking/synthesis`;

/**
 * Creates the specifications section of the prompt
 */
const createSpecificationsSection = (
  materialRecord: Partial<IMaterial>,
  extractedText: string
): string => `
Additional Specifications:
- Options formatted: ["A. option", "B. option", "C. option", "D. option"]
- MCQ answer must be one of the options
- Fill-in answers should be precise
- True/False answers strictly "true" or "false"
- Include lecture number if multiple lectures
- Evaluate numerical answers
- Provide comprehensive explanations

Prompt:
Generate structured JSON questions from the following text: ${extractedText}
- If text contains multiple lectures, include lecture number
- Aim for ${QUESTION_CONFIG.targetQuestions.min}-${QUESTION_CONFIG.targetQuestions.max} total questions
- Generate your own questions to meet total question count
- Update explanation field with detailed rationales
- Evaluate and update numerical answers
- Author ID: ${QUESTION_CONFIG.authorId}
- Lecture number: ${materialRecord.questionRefType}
- Maintain courseId from input: ${materialRecord.courseId}

Important:
- Focus on core concepts and understanding
- Include practical applications
- Encourage critical thinking
- Generate comprehensive questions
- Follow specified distributions
- Maintain data consistency
- Ensure non-repetitive questions`;

/**
 * Generates quiz questions from educational material
 * @param fileUrl URL of the material to process
 * @returns Generated questions
 * @throws Error if material processing fails
 */
const generateQuestions = async (
  fileUrl: string
): Promise<OutputQuestion[]> => {
  try {
    const validatedUrl = z.string().url().parse(fileUrl);

    const materialRecord = await Material.findOne({ url: validatedUrl });
    if (!materialRecord) {
      throw new Error("Material not found");
    }

    if (materialRecord.isProcessed) {
      throw new Error("Material already processed");
    }

    const extractedText = await extractText(fileUrl, materialRecord.type);
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("Failed to extract text or extracted text is empty");
    }

    const { output } = await ai.generate({
      prompt: createPrompt(extractedText, materialRecord),
      output: { schema: outputSchema },
    });

    if (!output || output.length === 0) {
      throw new Error("Failed to generate questions");
    }

    const validatedQuestions = outputSchema.parse(output);

    await Material.findOneAndUpdate(
      { url: fileUrl },
      { isProcessed: true },
      { new: true, runValidators: true }
    );

    return validatedQuestions;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export { generateQuestions, outputSchema };
