import Jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Config } from "../config";
import { IUser } from "../interfaces";

interface TokenUser {
  role: "student" | "admin" | "moderator";
  isBanned: boolean;
  username: string;
}

async function generateAccessToken(user: Partial<IUser> | null) {
  try {
    if (!user) {
      throw new Error("User is undefined");
    }
    return await Jwt.sign(user, Config.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
  } catch (err: any) {
    throw new Error("User is undefined");
  }
}

async function generateRefreshToken(user: Partial<IUser>) {
  try {
    return await Jwt.sign(user, Config.REFRESH_TOKEN_SECRET);
  } catch (err: any) {
    throw new Error("User is undefined");
  }
}

async function verifyToken(token: string): Promise<TokenUser | null> {
  try {
    const decoded = (await Jwt.verify(
      token,
      Config.ACCESS_TOKEN_SECRET
    )) as JwtPayload;

    if (!decoded || !decoded.id) {
      throw new Error("Invalid token format");
    }

    const username = decoded.username;
    const role = decoded.role;
    const isBanned = decoded.isBanned;

    return { username, role, isBanned } as TokenUser;
  } catch (err: any) {
    return null;
  }
}

async function verifyRefreshToken(token: string) {
  try {
    const decoded = (await Jwt.verify(
      token,
      Config.REFRESH_TOKEN_SECRET
    )) as JwtPayload;

    if (!decoded || !decoded.id) {
      throw new Error("Invalid token format");
    }

    const userId = decoded.id;
    const email = decoded.email;

    return { id: userId, email: email } as Partial<IUser>;
  } catch (err: any) {
    return null;
  }
}

async function hashPassword(password: string) {
  try {
    return await bcrypt.hash(password, Config.SALT_ROUNDS);
  } catch (err: any) {
    throw new Error("Password is required");
  }
}

async function verifyPassword(password: string, hashedPassword: string) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (err: any) {
    throw new Error("Password is required");
  }
}

export {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
};
