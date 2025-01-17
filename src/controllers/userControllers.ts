import { User } from "../models";
import { IUser } from "../interfaces";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "./authControllers";
import { Config } from "../config";

async function isUserValid(prop: string | undefined) {
  const user = await User.findOne({ prop });

  if (user) {
    return true;
  }

  return false;
}

async function generateUUID() {
  const id = await uuidv4();

  const isValid = await isUserValid(id);

  if (isValid) {
    return generateUUID();
  }

  return id;
}

async function createUser(user: Partial<IUser>) {
  try {
    const isValid = !(await isUserValid(user.email));

    if (!isValid) {
      throw new Error("User already exists");
    }

    const id = await generateUUID();
    const { password, ...userDetails } = user;

    const hashedPassword = await hashPassword(password!);

    const newUser = new User({
      id: id,
      password: hashedPassword,
      ...userDetails,
    });

    await newUser.save();

    const { _id, ...userDoc } = newUser.toObject();

    return userDoc;
  } catch (err: any) {
    throw err.message;
  }
}

async function updateUser(userId: string, updatedUser: Partial<IUser>) {
  try {
    const isValid = await isUserValid(userId);

    if (!isValid) {
      throw new Error("User not found");
    }

    if (updatedUser.password) {
      updatedUser.password = await hashPassword(updatedUser.password);
    }

    const updatedUserData = await User.findOneAndUpdate(
      { id: userId },
      { $set: updatedUser },
      { new: true }
    );

    if (!updatedUserData) {
      throw new Error("Error updating user");
    }

    const { _id, ...updatedUserDoc } = updatedUserData.toObject();

    return updatedUserDoc;
  } catch (err: any) {
    throw err.message;
  }
}

async function deleteUser(userId: string) {
  try {
    const isValid = await isUserValid(userId);

    if (!isValid) {
      throw new Error("User not found");
    }

    const userDoc = await User.findOneAndUpdate(
      { id: userId },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!userDoc) {
      throw new Error("Error deleting user");
    }

    const { _id, ...updatedUserDoc } = userDoc!.toObject();

    return updatedUserDoc;
  } catch (err: any) {
    throw err.message;
  }
}

async function findUserByEmail(email: string) {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return null;
    }

    const { _id, ...userDoc } = user.toObject();

    return userDoc;
  } catch (err: any) {
    throw err.message;
  }
}

async function findUserByUsername(username: string) {
  try {
    const user = await User.findOne({ username });

    if (!user) {
      return null;
    }

    const { _id, ...userDoc } = user.toObject();

    return userDoc;
  } catch (err: any) {
    throw err.message;
  }
}

async function getUserRole(email: string) {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return null;
    }

    return user.role;
  } catch (err: any) {
    throw err.message;
  }
}

export {
  createUser,
  updateUser,
  deleteUser,
  findUserByEmail,
  findUserByUsername,
  getUserRole,
};
