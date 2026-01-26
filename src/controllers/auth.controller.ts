import Jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Config } from "../config";
import { IUser } from "../interfaces";

interface TokenUser {
  username: string;
  role: string;
  isBanned: boolean;
  exp?: number | undefined;
}

async function generateAccessToken(user: TokenUser) {
  if (!user || Object.keys(user).length === 0) {
    throw new Error("Invalid user object for access token generation");
  }

  return Jwt.sign(
    { username: user.username, role: user.role, isBanned: user.isBanned },
    Config.ACCESS_TOKEN_SECRET,
    { expiresIn: "60m" }
  );
}

async function generateRefreshToken(user: Partial<IUser>, expiresIn: string = "15m") {
  if (!user || Object.keys(user).length === 0) {
    throw new Error("Invalid user object for access token generation");
  }

  return Jwt.sign(
    { username: user.username, role: user.role, isBanned: user.isBanned },
    Config.REFRESH_TOKEN_SECRET,
    { expiresIn: expiresIn } as any
  );
}

async function verifyToken(token: string): Promise<TokenUser | null> {
  try {
    const decoded = (await Jwt.verify(
      token,
      Config.ACCESS_TOKEN_SECRET
    )) as JwtPayload;

    if (!decoded || !decoded.username) {
      throw new Error("Invalid token format");
    }

    const username = decoded.username;
    const role = decoded.role;
    const isBanned = decoded.isBanned;
    const exp = decoded.exp;

    return { username, role, isBanned, exp };
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

    if (!decoded || !decoded.username) {
      throw new Error("Invalid token format");
    }

    const username = decoded.username;
    const role = decoded.role;
    const isBanned = decoded.isBanned;

    return { username, role, isBanned } as Partial<IUser>;
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
