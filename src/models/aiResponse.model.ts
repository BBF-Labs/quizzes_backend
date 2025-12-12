import { Schema, model, Model } from "mongoose";
import { IAIResponse } from "../interfaces";

const AiResponseSchema = new Schema<IAIResponse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
    },
    query: {
      type: String,
      required: true,
    },
    responses: [{
      modelName: {
        type: String,
        required: true,
      },
      response: {
        type: String,
        required: true,
      }, 
      probabilityScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
      responseTime: {
        type: Number,
      },
      tokensUsed: {
        type: Number,
      },
      evaluationMetrics: {
        accuracy: {
          type: Number,
          min: 0,
          max: 100,
        },
        relevance: {
          type: Number,
          min: 0,
          max: 100,
        },
        clarity: {
          type: Number,
          min: 0,
          max: 100,
        }, 
        confidence: {
          type: Number,
          min: 0,
          max: 100,
        },
      }
    }],
    selectedResponse: {
      type: String,
    },
    selectedModelName: {
      type: String,
      required: false, // Migration Notes
    }, 
    creditsCharged: {
      type: Number,
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "StudyPartnerSession",
    },
    queryType: {
      type: String,
      enum: ["explanation", "answer", "hint", "discussion", "other" ],
      required: true,
    },
    personaId: {
      type: Schema.Types.ObjectId,
      ref: "ChatbotPersona",
      required: false, // Migration Notes
    }
  },
  {
    timestamps: true
  }
);

AiResponseSchema.index({userId: 1, createdAt: -1});
AiResponseSchema.index({sessionId: 1, createdAt: -1});

const AiResponse: Model<IAIResponse> = model<IAIResponse>("AiResponse", AiResponseSchema);
export default AiResponse;