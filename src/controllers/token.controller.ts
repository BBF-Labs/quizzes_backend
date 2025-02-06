import { IToken } from "../interfaces";
import { Token, User } from "../models";
import { Config } from "../config";
import jwt, { JwtPayload } from "jsonwebtoken";
import { generateRefreshToken } from "./auth.controller";

async function saveToken(username: string, token: Partial<IToken>) {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error("User not found");
    }

    const tokenData = new Token({ ...token, userId: user._id });
    await tokenData.save();
  } catch (err: any) {
    throw new Error(`Error saving token: ${err.message}`);
  }
}

async function updateToken(username: string, token: Partial<IToken>) {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error("User not found");
    }

    const existingToken = await Token.findOne({ userId: user._id });

    if (!existingToken) {
      // If no token exists for the user, save the new token
      await saveToken(username, token);
      return { message: "New token saved" };
    }

    if (token.accessToken) {
      existingToken.accessToken = token.accessToken;
    }

    if (token.refreshToken) {
      existingToken.refreshToken = token.refreshToken;
    }

    await existingToken.save();

    return { message: "Token updated" };
  } catch (err: any) {
    throw new Error(`Error updating token: ${err.message}`);
  }
}

async function invalidateMultipleSessions(token: string) {
  try {
    const decoded = jwt.verify(token, Config.ACCESS_TOKEN_SECRET) as JwtPayload;

    if (!decoded) {
      throw new Error("Invalid token, please login again");
    }

    const { ...data } = decoded;

    const user = await User.findOne({ username: data.username });

    if (!user) {
      throw new Error("User not found");
    }

    if (Date.now() >= decoded.exp! * 1000) {
      throw new Error("Token expired, please login again");
    }

    const existingToken = await Token.findOne({ userId: user._id });

    if (existingToken) {
      if (existingToken.accessToken === token) {
        return { message: "Token is valid and session is the same" };
      } else {
        throw new Error("Multiple sessions detected. Please login again.");
      }
    } else {
      try {
        const refreshToken = await generateRefreshToken({
          username: user.username,
          role: user.role,
          isBanned: user.isBanned,
        });

        const newToken = new Token({
          accessToken: token,
          refreshToken,
          userId: user._id,
        });

        await newToken.save();
        return { message: "Token validated and new session created" };
      } catch (err: any) {
        throw new Error(`Error generating refresh token: ${err.message}`);
      }
    }
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired, please login again");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`Error validating token: ${error.message}`);
    }
    throw new Error(`Error validating token: ${error.message}`);
  }
}

export { saveToken, invalidateMultipleSessions, updateToken };
