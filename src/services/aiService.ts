
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
  context: string,
  type: 'update' | 'promotional' | 'security' | 'general' = 'update'
): Promise<{ subject: string; content: string }> => {
  try {
    const prompt = `Generate a ${type.toUpperCase()} newsletter for BetaForge Labs waitlist users.
    
    Context Information:
    ${context}

    Email Type & Voice:
    - UPDATE: Technical, transparent, and progress-oriented. Focus on "what we built" and "where we are on the roadmap".
    - PROMOTIONAL: High energy, marketing-driven, and persuasive. Focus on "why you should be excited" and "missing out is not an option". Use emotional hooks.
    - SECURITY: Grave, clear, and authoritative. Focus on "keeping your data safe" and "privacy as a human right". Be reassuring but firm.
    - GENERAL: Friendly, community-oriented, and conversational. Focus on stories, community shoutouts, or high-level announcements.

    Instructions:
    1. ${type === 'promotional' ? 'Create an irresistible, FOMO-inducing subject line.' : 'Provide a clear and engaging subject line.'}
    2. The content MUST be in high-quality Markdown.
    3. Tone: ${type === 'security' ? 'Reassuring but serious.' : type === 'promotional' ? 'Extremely exciting and urgent.' : 'Professional and innovative.'}
    4. Highlight the key updates provided in the context.
    5. Always refer to the team as "The BetaForge Labs Team".
    6. Close with a powerful call to action${type === 'promotional' ? ' that creates urgency.' : '.'}
    7. NEVER include any greeting or salutation (e.g., "Hello,", "Hi there,", "Dear Waitlist Member,") at the start. The system already provides a "Hello [Name]," header. Start immediately with the email body content.

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
