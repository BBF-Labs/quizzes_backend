import Jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Config } from "../config";
import { IUser } from "../interfaces";

interface TokenUser {
  username: string;
  role: string;
  isBanned: boolean;
}

async function generateAccessToken(user: Partial<IUser> | null) {
  return await Jwt.sign(user!, Config.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

async function generateRefreshToken(user: Partial<IUser>) {
  return await Jwt.sign(user, Config.REFRESH_TOKEN_SECRET);
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

    return { username, role, isBanned };
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

    const username = decoded.username;
    const role = decoded.role;
    const isBanned = decoded.isBanned;

    return { username, role, isBanned };
  } catch (err: any) {
    return null;
  }
}

async function hashPassword(password: string) {
  return await bcrypt.hash(password, Config.SALT_ROUNDS);
}

async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}

export {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
};
