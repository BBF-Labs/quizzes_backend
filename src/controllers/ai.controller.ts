import { gemini20Flash, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import axios from "axios";
import { parseOfficeAsync, OfficeParserConfig } from "officeparser";
import { z } from "zod";
import { IMaterial, IQuestion } from "../interfaces";
import { Config } from "../config";
import { Material, Question } from "../models";
import Tesseract from "tesseract.js";

// Initialize AI client
const ai = genkit({
  plugins: [googleAI({ apiKey: Config.GOOGLE_GENAI_API_KEY })],
  model: gemini20Flash,
});

// Types and Schemas
const MaterialTypeEnum = z.enum([
  "pdf",
  "doc",
  "slides",
  "text",
  "img",
  "link",
  "data",
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
    courseId: z.string().describe("The unique identifier for the course."),
    question: z.string().describe("The text of the question."),
    options: z.array(z.string()).describe("The possible answer options."),
    answer: z.string().describe("The correct answer to the question."),
    type: QuestionTypeEnum.describe(
      "The type of question (mcq, fill-in, true-false)."
    ),
    explanation: z
      .string()
      .describe("A detailed explanation of the correct answer."),
    lectureNumber: z
      .string()
      .describe("The lecture or section number the question relates to."),
    hint: z.string().describe("A short hint to help answer the question."),
    author: z.string().describe("The author ID."),
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
export const extractText = async (
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

      case "data":
        return await JSON.parse(buffer.toString());

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
  materialRecord: Partial<IMaterial>,
  existingQuestions: IQuestion[] | null
): string => {
  const isAssessmentMaterial = ["quiz", "IA"].includes(
    materialRecord.questionRefType?.toLowerCase() || ""
  );

  const questionCount = isAssessmentMaterial
    ? "the exact number of questions available in the document"
    : "15-20 questions per lecture/section";

  return `You are an AI that generates quiz questions from educational materials. Your primary goal is to produce high-quality, diverse, and relevant questions that accurately assess understanding of the provided content.

Content:
${extractedText}

Context and Instructions:
- Course ID: ${materialRecord.courseId}
- Author ID: ${QUESTION_CONFIG.authorId}
- Material Type: ${materialRecord.questionRefType} (e.g., lecture notes, quiz)
- Is Assessment Material: ${isAssessmentMaterial}

Instructions for Handling Existing Questions:
- Existing Questions: ${
    existingQuestions ? JSON.stringify(existingQuestions) : "None"
  }.  Use these as a guide to avoid duplication and understand the existing question style.  If existing questions are present, prioritize generating new questions that cover different aspects of the content.

Question Generation Rules:
- Number of Questions: Generate ${questionCount}. If you think the questions available is not as many as stated, generate as many as possible to get close.
- Focus:
  - Core concepts
  - Key definitions
  - Important processes and methods
  - Real-world applications
  - Critical relationships between concepts
- Avoid:
  - Course/department names
  - Credit hours or administrative details
  - Lecturer information
  - Formatting or presentation details
- Difficulty:  Adhere to the following difficulty distribution:
    - Basic: ${QUESTION_CONFIG.difficultyDistribution.basic * 100}%
    - Intermediate: ${
      QUESTION_CONFIG.difficultyDistribution.intermediate * 100
    }%
    - Advanced: ${QUESTION_CONFIG.difficultyDistribution.advanced * 100}%
    - Critical Thinking: ${
      QUESTION_CONFIG.difficultyDistribution.critical * 100
    }%
- Question Types:  Adhere to the following type distribution:
    - MCQ: ${QUESTION_CONFIG.typeDistribution.mcq * 100}%
    - Fill-in-the-Blank: ${QUESTION_CONFIG.typeDistribution.fillIn * 100}%
    - True/False: ${QUESTION_CONFIG.typeDistribution.trueFalse * 100}%

Specific Instructions Based on Material Type:
${
  isAssessmentMaterial
    ? `- Assessment materials (quiz/IA):  Parse and structure existing questions *only*.  Do not generate *additional* questions.  Extract question text, answer options (if MCQ), and correct answers. Your returned question count should match the count of the text questions.  Prioritize accuracy and preservation of the original questions.
       - Maintain original question format and content.
       - Add short hints to help answer.
       - Provide a short explanation even if there aren't any in the material.
       - Extract question text (do not include any prefixes like "Question X.")
       - Answer options (if MCQ)
       - Correct answers`
    : `- Lecture Materials:  Generate new questions from the material. Base the lectureNumber field on the most appropriate value from materialRecord.questionRefType. Questions must focus exclusively on:
   - Core concepts and theories
   - Key definitions
   - Important processes and methods
   - Real-world applications
   - Critical relationships between concepts
   - Add short hints to aid with answering
Strictly exclude:
   - Course/department names
   - Credit hours or administrative details
   - Lecturer information
   - Formatting or presentation details
4. Set lectureNumber field based on:
   - Use numeric values if lectures/weeks/session are numbered (1, 2, 3)
   - Use ${materialRecord.questionRefType} if no clear lecture structure`
}

Format Requirements for Questions:
- MCQ: Options must start with "A.", "B.", "C.", "D.". Answer must match one of the options *exactly*.
- Fill-in: Answers must be precise and unambiguous. No partial credit options.
- True/False: Answers must be exactly "true" or "false".
- Explanations: Provide detailed explanations of *why* the correct answer is correct.
- Hints: Always include helpful hints for each question.
- Lecture References:  Include relevant lecture/section references.
- All questions must include clear, concise question text (do not include any prefixes like "Question X.")
- Since questions would be rendered in html tags, use proper tags to handle necessary items, code, subscript, superscript, etc.

Response Format:
- Return your output as a JSON array of IQuestion objects.  Ensure the JSON is valid and follows the schema exactly.

Example Response:
\`\`\`json
[
  {
    "courseId": "${materialRecord.courseId}",
    "question": "What is the capital of France?",
    "options": ["A. London", "B. Paris", "C. Rome", "D. Berlin"],
    "answer": "B. Paris",
    "type": "mcq",
    "explanation": "Paris is the capital and most populous city of France.",
    "lectureNumber": "${materialRecord.questionRefType}",
    "hint": "Think about famous landmarks in France.",
    "author": "${QUESTION_CONFIG.authorId}"
  }
]
\`\`\`

Now, generate the questions:
`;
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

    const questionsDoc = (await Question.find({
      courseId: materialRecord.courseId,
    }).lean()) as unknown as IQuestion[]; // Type cast to fix TypeScript error

    const extractedText = await extractText(fileUrl, materialRecord.type);
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("Failed to extract text or extracted text is empty");
    }

    let allQuestions: OutputQuestion[] = [];
    let totalQuestionsRequested = 0;

    // Loop to request questions until we reach the desired count
    while (totalQuestionsRequested < QUESTION_CONFIG.targetQuestions.min) {
      const prompt = createPrompt(extractedText, materialRecord, questionsDoc);
      const { output } = await ai.generate({
        prompt: prompt,
        output: { schema: outputSchema },
      });

      if (!output || output.length === 0) {
        console.warn("AI failed to generate questions in this iteration."); // Log warning instead of error
        continue; // Skip to the next iteration
      }

      try {
        const validatedQuestions = outputSchema.parse(output);

        // Filter out duplicates (more efficient approach)
        const uniqueQuestions = validatedQuestions.filter((question) => {
          return !allQuestions.some(
            (existingQuestion) =>
              existingQuestion.question.trim() === question.question.trim()
          );
        });

        allQuestions = [...allQuestions, ...uniqueQuestions];
        totalQuestionsRequested = allQuestions.length;

        console.log(
          `Generated ${uniqueQuestions.length} unique questions in this iteration.`
        );
      } catch (validationError) {
        console.error(
          "Validation error in generated questions:",
          validationError
        );
        continue; // Skip to next iteration if validation fails
      }

      // Optional: Limit the number of iterations to prevent infinite loops
      if (totalQuestionsRequested >= QUESTION_CONFIG.targetQuestions.max) {
        break;
      }
    }

    // Update material record (move outside the loop)
    await Material.findOneAndUpdate(
      { url: fileUrl },
      { isProcessed: true },
      { new: true, runValidators: true }
    );

    //Save questions to DB
    await Question.insertMany(allQuestions);
    console.log("Successfully added questions to DB");

    return allQuestions.slice(0, QUESTION_CONFIG.targetQuestions.max); // Return only up to the max limit
  } catch (error) {
    console.error("Error during question generation:", error); // Log the full error
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export { generateQuestions, outputSchema };
