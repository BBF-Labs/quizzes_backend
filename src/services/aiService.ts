
import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";
import { z } from "zod";
import IMaterial from "../interfaces/IMaterial";
import { Config } from "../config";
import { extractText } from "../controllers/ai.controller";

// Initialize AI client
export const ai = genkit({
  plugins: [googleAI({ apiKey: Config.GOOGLE_GENAI_API_KEY })],
  model: "gemini-3-flash-preview",
});

// Output schema for personal quiz generation
const personalQuizOutputSchema = z.object({
  title: z
    .string()
    .describe("A descriptive title for the quiz based on the material content"),
  description: z
    .string()
    .describe("A brief description of what the quiz covers"),
  questions: z
    .array(
      z.object({
        question: z.string().describe("The question text"),
        options: z.array(z.string()).describe("Multiple choice options"),
        answer: z.string().describe("The correct answer"),
        type: z
          .enum(["mcq", "fill-in", "true-false"])
          .describe("Question type (mcq, fill-in, true-false)"),
        explanation: z.string().describe("Explanation of the answer"),
        hint: z.string().describe("Hint for the question"),
        difficulty: z
          .enum(["basic", "intermediate", "advanced", "critical"])
          .describe(
            "Question difficulty level (basic, intermediate, advanced, critical)"
          ),
        lectureNumber: z
          .string()
          .optional()
          .describe("Lecture or section number"),
      })
    )
    .describe("Array of generated questions"),
  tags: z.array(z.string()).describe("Relevant tags for the quiz content"),
  estimatedDuration: z
    .number()
    .describe("Estimated time to complete the quiz in minutes"),
});

type PersonalQuizOutput = z.infer<typeof personalQuizOutputSchema>;

export interface GeneratedQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  type: "mcq" | "fill-in" | "true-false";
  difficulty: "basic" | "intermediate" | "advanced" | "critical";
  lectureNumber?: string;
  hint?: string;
}

export interface GeneratedPersonalQuiz {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
  tags: string[];
  estimatedDuration: number;
}

export const generatePersonalQuizFromMaterial = async (
  material: IMaterial,
  questionCount: number = 10
): Promise<GeneratedPersonalQuiz> => {
  try {
    // Create a comprehensive prompt for generating the entire quiz

    const text = await extractText(material.url, material.type);

    const prompt = `Generate a complete personal quiz from the following educational material.

Material Information:
- Title: ${material.title}
- Type: ${material.type}
- Course: ${material.courseId}

Material Content:
${text}

Instructions:
1. Generate a complete quiz package including:
   - A descriptive title that reflects the material content
   - A brief description explaining what the quiz covers
   - ${questionCount} well-structured questions
   - Relevant tags for categorization
   - Estimated completion time

2. Question Requirements:
   - Clear and well-structured questions
   - Appropriate for university-level students
   - Cover key concepts from the material
   - Include helpful hints and explanations
   - Mix of question types: mcq (60%), fill-in (20%), true-false (20%)

3. Question Types:
   - mcq: 4 options (A, B, C, D), answer must match exactly
   - true-false: Options must be exactly "true" or "false" (lowercase)
   - fill-in: Concise, specific answers

4. Difficulty Distribution:
   - basic: 40% (fundamental concepts)
   - intermediate: 30% (moderate understanding)
   - advanced: 20% (complex concepts)
   - critical: 10% (expert-level understanding)

5. Format Requirements:
   - Questions must be clear and concise
   - Options for multiple choice must be plausible
   - Hints should be helpful but not give away the answer
   - Explanations should explain why the answer is correct
   - Tags should be relevant to the subject matter
   - Estimated duration should be realistic (5-10 minutes per question)

Generate a complete quiz package following the schema exactly.`;

    // Generate the complete quiz using Genkit
    const { output } = await ai.generate({
      prompt,
      output: { schema: personalQuizOutputSchema },
    });

    if (!output) {
      throw new Error("Failed to generate quiz");
    }

    // Validate the output
    const validatedQuiz = personalQuizOutputSchema.parse(output);

    // Transform to our interface format
    const generatedQuiz: GeneratedPersonalQuiz = {
      title: validatedQuiz.title,
      description: validatedQuiz.description,
      questions: validatedQuiz.questions.map((q) => ({
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        type: q.type,
        difficulty: q.difficulty,
        lectureNumber: q.lectureNumber,
        hint: q.hint,
      })),
      tags: validatedQuiz.tags,
      estimatedDuration: validatedQuiz.estimatedDuration,
    };

    return generatedQuiz;
  } catch (error) {
    console.error("Error generating personal quiz with Genkit:", error);
    throw new Error("Failed to generate personal quiz. Please try again.");
  }
};

// Output schema for waitlist update generation
const waitlistUpdateOutputSchema = z.object({
  subject: z.string().describe("Catchy email subject line"),
  content: z.string().describe("Markdown content for the newsletter"),
});

export const generateWaitlistMarkdown = async (
  context: string
): Promise<{ subject: string; content: string }> => {
  try {
    const prompt = `Generate a newsletter update for our waitlist users.
    
    Context Information:
    ${context}

    Instructions:
    1. Provide a catchy, engaging subject line.
    2. The content MUST be in Markdown format.
    4. Highlight the key updates provided in the context.
    5. Maintain a professional yet exciting tone (BetaForge Labs).
    6. Close with a call to action or a "stay tuned" message.
    7. Do not include user-specific placeholders like [Name] in the markdown body itself (the template handles the greeting name).

    Generate the subject and markdown content following the schema precisely.`;

    const { output } = await ai.generate({
      prompt,
      model: googleAI.model("gemini-2.5-flash"),
     output: { schema: waitlistUpdateOutputSchema },
    });

    if (!output) {
      throw new Error("Failed to generate waitlist update");
    }

    return waitlistUpdateOutputSchema.parse(output);
  } catch (error) {
    console.error("Error generating waitlist markdown:", error);
    throw new Error("Failed to generate waitlist update. Please try again.");
  }
};

// Keep the old function for backward compatibility
export const generateQuestionsFromMaterial = async (
  material: IMaterial,
  questionCount: number
): Promise<GeneratedQuestion[]> => {
  const quiz = await generatePersonalQuizFromMaterial(material, questionCount);
  return quiz.questions;
};
