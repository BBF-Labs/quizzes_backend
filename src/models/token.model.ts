import { IToken } from "../interfaces";
import { Schema, model, Model } from "mongoose";

const TokenSchema = new Schema<IToken>({
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const Token: Model<IToken> = model<IToken>("Token", TokenSchema);

export default Token;
