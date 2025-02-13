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
    hint: z.string(),
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
  const isAssessmentMaterial = ["quiz", "IA"].includes(
    materialRecord.questionRefType?.toLowerCase() || ""
  );

  const questionCount = isAssessmentMaterial
    ? "the exact number of questions available in the document"
    : "15-20 questions per lecture/section";

  return `Using the following interface:
interface IQuestion { 
  courseId: ${materialRecord.courseId}; 
  question: string; 
  options: string[]; 
  answer: string; 
  type: "mcq" | "fill-in" | "true-false"; 
  explanation: string; 
  lectureNumber: ${materialRecord.questionRefType}; 
  hint: string;
  author: ${QUESTION_CONFIG.authorId}; 
}

Content Processing Instructions:
1. First determine if this is an assessment material (quiz/IA) or lecture material
   Assessment material indicators:
   - Contains formatted questions
   - Has question numbering
   - Includes answer options or answer keys
   - Has quiz/exam/assessment structure

Processing Rules:

${
  isAssessmentMaterial
    ? `
For Assessment Materials (Quiz/IA):
1. Parse and structure existing questions only, parse all questions and create, don't send less than the questions available in the document
2. Maintain original question format and content
3. Do not generate additional questions
4. Extract and format:
   - Question text
   - Answer options (if MCQ)
   - Correct answers
   - Add hints to help answer
   - Any provided explanations, provide one if there aren't any
IMPORTANT: Your returned question count should match the count of the text questions
`
    : `
For Lecture Materials:
1. Generate ${questionCount}
2. Questions must focus exclusively on:
   - Core concepts and theories
   - Key definitions
   - Important processes and methods
   - Real-world applications
   - Critical relationships between concepts
   - Add hints to aid with answering
3. Strictly exclude:
   - Course/department names
   - Credit hours or administrative details
   - Lecturer information
   - Formatting or presentation details
4. Set lectureNumber field based on:
   - Use numeric values if lectures/weeks/session are numbered (1, 2, 3)
   - Use ${materialRecord.questionRefType} if no clear lecture structure
`
}

Question Types Distribution:
- ${QUESTION_CONFIG.typeDistribution.mcq * 100}% Multiple Choice (MCQ)
- ${QUESTION_CONFIG.typeDistribution.fillIn * 100}% Fill-in-the-Blank
- ${QUESTION_CONFIG.typeDistribution.trueFalse * 100}% True/False

Difficulty Level Distribution:
- ${QUESTION_CONFIG.difficultyDistribution.basic * 100}% Basic comprehension
- ${
    QUESTION_CONFIG.difficultyDistribution.intermediate * 100
  }% Intermediate analysis
- ${QUESTION_CONFIG.difficultyDistribution.advanced * 100}% Advanced application
- ${QUESTION_CONFIG.difficultyDistribution.critical * 100}% Critical thinking

Format Requirements:
1. MCQ requirements:
   - Options must start with "A.", "B.", "C.", "D."
   - Answer must match one of the options exactly
2. Fill-in requirements:
   - Answers must be precise and unambiguous
   - No partial credit options
3. True/False requirements:
   - Answers must be exactly "true" or "false"
4. All questions must include:
   - Clear, concise question text
   - Detailed explanation of the correct answer
   - Appropriate difficulty level
   - Must have hints
   - Relevant lecture/section reference

Required Metadata:
- Author ID: ${QUESTION_CONFIG.authorId}
- Course ID: ${materialRecord.courseId}

Process this content following the above guidelines:
${extractedText}`;
};

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

    let allQuestions: OutputQuestion[] = [];
    let totalQuestionsRequested = 0;

    // Loop to request questions until we reach the desired count
    while (totalQuestionsRequested < QUESTION_CONFIG.targetQuestions.min) {
      const { output } = await ai.generate({
        prompt: createPrompt(extractedText, materialRecord),
        output: { schema: outputSchema },
      });

      if (!output || output.length === 0) {
        throw new Error("Failed to generate questions");
      }

      const validatedQuestions = outputSchema.parse(output);
      // Filter out duplicates
      const uniqueQuestions = validatedQuestions.filter((question) => {
        return !allQuestions.some(
          (existingQuestion) => existingQuestion.question === question.question
        );
      });

      allQuestions = [...allQuestions, ...uniqueQuestions];
      totalQuestionsRequested = allQuestions.length;

      console.log(
        `Generated ${uniqueQuestions.length} unique questions in this iteration.`
      );

      // Optional: Limit the number of iterations to prevent infinite loops
      if (allQuestions.length >= QUESTION_CONFIG.targetQuestions.max) {
        break;
      }
    }

    await Material.findOneAndUpdate(
      { url: fileUrl },
      { isProcessed: true },
      { new: true, runValidators: true }
    );

    return allQuestions.slice(0, QUESTION_CONFIG.targetQuestions.max); // Return only up to the max limit
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export { generateQuestions, outputSchema };
