import { gemini15Flash, googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import axios from "axios";
import { parseOfficeAsync, OfficeParserConfig } from "officeparser";
import { z } from "zod";
import { Config } from "../config";
import { Material } from "../models";
import Tesseract from "tesseract.js";

const ai = genkit({
  plugins: [googleAI({ apiKey: Config.GOOGLE_GENAI_API_KEY })],
  model: gemini15Flash,
});

interface IMaterialType {
  type: "pdf" | "doc" | "slides" | "text" | "img" | "link";
}

const config: OfficeParserConfig = {
  newlineDelimiter: " ",
  ignoreNotes: true,
};

const extractText = async (
  fileUrl: string,
  type: IMaterialType["type"]
): Promise<string> => {
  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data);

  switch (type) {
    case "pdf":
    case "doc":
    case "slides":
      return await parseOfficeAsync(buffer, config);

    case "text":
      return buffer.toString("utf-8");

    case "img":
      return (await Tesseract.recognize(buffer, "eng")).data.text;

    default:
      throw new Error("Unsupported file type");
  }
};

const inputSchema = z.object({
  fileUrl: z.string().url(),
  type: z.enum(["pdf", "doc", "slides", "text", "img", "link"]),
});

const outputSchema = z.array(
  z.object({
    courseId: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
    type: z.enum(["mcq", "fill-in", "true-false"]),
    explanation: z.string(),
    lectureNumber: z.string(),
    author: z.string(),
  })
);

const generateQuestions = async (fileUrl: string) => {
  try {
    const materialRecord = await Material.findOne({ url: fileUrl });

    if (!materialRecord) {
      throw new Error("Material not found.");
    }

    if (materialRecord.isProcessed) {
      throw new Error("Material already processed.");
    }

    const materialType = materialRecord.type;
    const refType = materialRecord.questionRefType;
    const extractedText = await extractText(fileUrl, materialType);

    if (!extractedText) throw new Error("Failed to extract text.");

    const { output } = await ai.generate({
      prompt: `Using the following interface:
interface IQuestion { 
  courseId: ${materialRecord.courseId}; 
  question: string; 
  options: string[]; 
  answer: string; 
  type: "mcq" | "fill-in" | "true-false"; 
  explanation?: string; 
  lectureNumber?: ${refType}; 
  author: 67aa146c0b3df638fe8ef06f; 
}

Guidelines for Question Generation:
1. Focus on conceptual understanding, avoiding superficial details
2. Ensure questions test:
   - Core concepts
   - Theoretical principles
   - Practical applications
   - Critical thinking
   - Analytical reasoning

Question Generation Rules:
- Generate minimum 20-25 questions per material
- Cover breadth and depth of content
- Exclude trivial information like:
  * Course/department names
  * Credit hours
  * Lecturer details
  * Slide formatting
  * Administrative information

Question Types:
- 60% Multiple Choice (MCQ)
- 20% Fill-in-the-Blank
- 20% True/False

Question Difficulty Distribution:
- 40% Basic comprehension
- 30% Intermediate analysis
- 20% Advanced application
- 10% Critical thinking/synthesis

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
- Aim for 40-50 total questions, regardless of text question count
- Generate your own questions to meet total question count
- Update explanation field with detailed rationales
- Evaluate and update numerical answers
- Author ID: 67aa146c0b3df638fe8ef06f
- Lecture number: ${refType}
- Maintain courseId from input, ${materialRecord.courseId}

Important:
- Focus on core concepts
- Avoid superficial details
- Ensure questions test understanding
- Include practical applications
- Encourage critical thinking
- Evaluate analytical reasoning
- Generate questions for all topics in text
- Follow question generation rules
- Maintain question type distribution
- Ensure question difficulty distribution
- Include comprehensive explanations
- Evaluate and update numerical answers
- Provide detailed rationales
- Include lecture number if multiple lectures
- Maintain author ID and courseId
- Target 40-50 questions total, non-repetitive
`,
      output: { schema: outputSchema },
    });

    if (output) {
      return output;
    } else {
      throw new Error("Failed to generate structured output.");
    }
  } catch (error: any) {
    throw error.message;
  }
};

export { generateQuestions, outputSchema };
