import Jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Config } from "../config";
import { IUser } from "../interfaces";

async function generateAccessToken(user: Partial<IUser>) {
  return await Jwt.sign(user, Config.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

async function generateRefreshToken(user: Partial<IUser>) {
  return await Jwt.sign(user, Config.REFRESH_TOKEN_SECRET);
}

async function verifyToken(token: string) {
  try {
    const decoded = (await Jwt.verify(
      token,
      Config.ACCESS_TOKEN_SECRET
    )) as JwtPayload;

    if (!decoded || !decoded.id) {
      throw new Error("Invalid token format");
    }

    const userId = decoded.id;
    const email = decoded.email;

    return { id: userId, email: email };
  } catch (err: any) {
    return null;
  }
}

async function verifyRefreshToken(token: string) {
  return await Jwt.verify(token, Config.REFRESH_TOKEN_SECRET);
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
