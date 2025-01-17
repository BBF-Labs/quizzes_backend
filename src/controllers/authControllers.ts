import Jwt from "jsonwebtoken";
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
  return await Jwt.verify(token, Config.ACCESS_TOKEN_SECRET);
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
