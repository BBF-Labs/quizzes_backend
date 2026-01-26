import { IQuizQuestion, IPagination, PaginatedResult } from "../interfaces";
import { Question, Course, QuizQuestion } from "../models";
import mongoose from "mongoose";

async function batchCreateQuizQuestions(questionIds: string | string[]) {
  if (
    !questionIds ||
    (Array.isArray(questionIds) && questionIds.length === 0)
  ) {
    throw new Error("No question IDs provided");
  }

  // Normalize input to array
  const questionIdArray = Array.isArray(questionIds)
    ? questionIds
    : [questionIds];

  // Validate ObjectIds
  const validQuestionIds = questionIdArray.map((id) =>
    mongoose.Types.ObjectId.createFromHexString(id)
  );

  // Fetch questions with course and lecture info
  const questions = await Question.find({
    _id: { $in: validQuestionIds },
  }).lean();

  if (questions.length === 0) {
    throw new Error("No questions found");
  }

  // Group questions by course and lecture number
  const courseQuestionMap = questions.reduce((acc, question) => {
    if (!acc[question.courseId.toString()]) {
      acc[question.courseId.toString()] = {};
    }

    const lectureKey = `Lecture ${question.lectureNumber}`;
    if (!acc[question.courseId.toString()][lectureKey]) {
      acc[question.courseId.toString()][lectureKey] = [];
    }

    acc[question.courseId.toString()][lectureKey].push(question._id);
    return acc;
  }, {} as Record<string, Record<string, mongoose.Types.ObjectId[]>>);

  // Batch create/update quiz documents
  const updatedQuizDocuments = await Promise.all(
    Object.entries(courseQuestionMap).map(
      async ([courseId, lectureGroupings]) => {
        let quizDocument = await QuizQuestion.findOne({ courseId });

        if (!quizDocument) {
          quizDocument = new QuizQuestion({
            name: `${(await Course.findById(courseId))?.code || courseId} Quiz`,
            courseId: new mongoose.Types.ObjectId(courseId),
            quizQuestions: Object.entries(lectureGroupings).map(
              ([name, questions]) => ({
                name,
                questions,
              })
            ),
            creditHours: 3,
          });
        } else {
          // Update existing quiz document
          Object.entries(lectureGroupings).forEach(([name, questions]) => {
            const existingLectureIndex = quizDocument?.quizQuestions.findIndex(
              (lq) => lq.name === name
            );

            if (existingLectureIndex !== -1) {
              // Update existing lecture's questions, avoiding duplicates
              const uniqueQuestions = [
                ...new Set([
                  ...quizDocument!.quizQuestions[existingLectureIndex!]
                    .questions,
                  ...questions,
                ]),
              ];
              quizDocument!.quizQuestions[existingLectureIndex!].questions =
                uniqueQuestions;
            } else {
              // Add new lecture to quiz questions
              quizDocument!.quizQuestions.push({ name, questions });
            }
          });
        }

        return await quizDocument.save();
      }
    )
  );

  return updatedQuizDocuments;
}

async function getCourseQuizQuestions(courseId: string) {
  try {
    const questions = await QuizQuestion.findOne({ courseId });

    if (!questions) {
      return null;
    }

    return questions;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getQuizQuestions(
  query: IPagination = { page: 1, limit: 10 }
): Promise<PaginatedResult<any>> {
  try {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search || "";

    const pipeline: any[] = [
      {
        $lookup: {
          from: "courses", // lookup from the courses collection
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" }, // Unwind to make course object accessible
    ];

    if (search) {
      const searchRegex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { "course.title": searchRegex },
            { "course.code": searchRegex },
          ],
        },
      });
    }

    pipeline.push(
      {
        $addFields: {
          title: "$course.title",
          category: "$course.code",
          lectureStats: {
            $map: {
              input: "$quizQuestions",
              as: "lecture",
              in: {
                name: "$$lecture.name",
                count: { $size: "$$lecture.questions" },
              },
            },
          },
          totalQuestions: {
            $reduce: {
              input: "$quizQuestions",
              initialValue: 0,
              in: { $add: ["$$value", { $size: "$$this.questions" }] },
            },
          },
          completions: { $ifNull: ["$completions", 0] },
          createdAt: "$createdAt",
        },
      },
      {
        $addFields: {
          // Calculate duration: (totalQuestions * 30 seconds) / 60 = minutes
          duration: {
            $toString: {
              $floor: {
                $divide: [{ $multiply: ["$totalQuestions", 30] }, 60],
              },
            },
          },
          // Rename totalQuestions to questions for frontend compatibility
          questions: "$totalQuestions",
          // Add id field as string version of _id for frontend
          id: { $toString: "$_id" },
        },
      },
      {
        $project: {
          course: 0,
          quizQuestions: 0,
          totalQuestions: 0, // Exclude since we renamed it to questions
        },
      },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          total: [{ $count: "count" }],
        },
      }
    );

    const [result] = await QuizQuestion.aggregate(pipeline);
    const questions = result.data;
    const total = result.total[0] ? result.total[0].count : 0;

    return {
      data: questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function updateQuizQuestion(quiz: Partial<IQuizQuestion>) {
  try {
    const { courseId, ...quizDetails } = quiz;

    const updateQuizDoc = await QuizQuestion.findOneAndUpdate(
      { courseId: courseId },
      { $set: quizDetails },
      { new: true }
    );

    return updateQuizDoc;
  } catch (err: any) {
    throw new Error(err.message);
  }
}
interface IFullQuizInfo {
  id: string;
  courseCode: string;
  isApproved: boolean;
  quizQuestions: Array<{
    name: string;
    questions: Array<{
      question: string;
      options: string[];
      answer: string;
      type: "mcq" | "fill-in" | "true-false";
      explanation?: string;
      lectureNumber?: string;
    }>;
  }>;
  questions: any[]; // Flattened questions array
  lectures: string[]; // Lecture names array
  creditHours?: number;
}

async function getFullQuizInformation(
  courseId: string
): Promise<IFullQuizInfo> {
  // Use aggregation pipeline for better performance
  const result = await QuizQuestion.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    {
      $project: {
        _id: 1,
        isApproved: 1,
        creditHours: 1,
        courseCode: "$course.code",
        quizQuestions: 1,
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new Error("No quiz found for this course");
  }

  const quizDocument = result[0];

  // Fetch all question IDs in a single query
  const allQuestionIds = quizDocument.quizQuestions.flatMap(
    (lecture: any) => lecture.questions
  );

  const allQuestions = await Question.find({
    _id: { $in: allQuestionIds },
  })
    .lean()
    .select("_id question options answer type explanation lectureNumber hint");

  // Create a map for quick lookup
  const questionMap = new Map(
    allQuestions.map((q: any) => [q._id.toString(), q])
  );

  // Build structured response
  const fullQuizQuestions: any[] = [];
  const flattenedQuestions: any[] = [];
  const lectureNames: string[] = [];

  quizDocument.quizQuestions.forEach((lecture: any) => {
    lectureNames.push(lecture.name);
    const lectureQuestions: any[] = [];

    lecture.questions.forEach((questionId: any) => {
      const question = questionMap.get(questionId.toString());
      if (question) {
        const formattedQuestion = {
          _id: question._id,
          question: question.question,
          options: question.options || [],
          answer: question.answer,
          type: question.type,
          explanation: question.explanation,
          lectureNumber: lecture.name,
          hint: question.hint,
        };

        lectureQuestions.push(formattedQuestion);
        flattenedQuestions.push(formattedQuestion);
      }
    });

    fullQuizQuestions.push({
      name: lecture.name,
      questions: lectureQuestions,
    });
  });

  return {
    id: quizDocument._id.toString(),
    courseCode: quizDocument.courseCode,
    isApproved: quizDocument.isApproved,
    quizQuestions: fullQuizQuestions,
    questions: flattenedQuestions,
    lectures: lectureNames,
    creditHours: quizDocument.creditHours,
  };
}

export {
  getCourseQuizQuestions,
  getQuizQuestions,
  batchCreateQuizQuestions,
  updateQuizQuestion,
  getFullQuizInformation,
};
