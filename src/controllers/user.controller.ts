import { User, Package, Payment } from "../models";
import { IUser } from "../interfaces";
import { hashPassword } from "./auth.controller";

async function isUserValid(prop: {
  email?: string;
  userId?: string;
  username?: string;
}) {
  const user = await User.findOne({
    $or: [
      { email: prop.email },
      { _id: prop.userId },
      { username: prop.username },
    ],
  });
  return user !== null;
}

async function createUser(user: Partial<IUser>) {
  try {
    const existingUser = await User.findOne({
      $or: [{ email: user.email }, { username: user.username }],
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const { password, ...userDetails } = user;
    const hashedPassword = await hashPassword(password!);

    const newUser = new User({
      password: hashedPassword,
      ...userDetails,
      role: userDetails.role || "student",
    });

    const savedUser = await newUser.save();

    const { password: _, ...userDoc } = savedUser.toObject();
    return userDoc;
  } catch (err: any) {
    throw new Error(`Error creating user: ${err.message}`);
  }
}

async function updateUser(userId: string, updatedUser: Partial<IUser>) {
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) throw new Error("User not found");

    if (updatedUser.password) {
      updatedUser.password = await hashPassword(updatedUser.password);
    }

    const updatedUserData = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updatedUser },
      { new: true }
    );

    if (!updatedUserData) throw new Error("Error updating user");

    const { _id, ...updatedUserDoc } = updatedUserData.toObject();
    return updatedUserDoc;
  } catch (err: any) {
    throw new Error(`Error updating user: ${err.message}`);
  }
}

async function deleteUser(userId: string) {
  try {
    const isValid = await isUserValid({ userId: userId });

    if (!isValid) {
      throw new Error("User not found");
    }

    const userDoc = await User.findOneAndUpdate(
      { _id: userId },
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

    return user;
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

    return user;
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

async function findUserById(userId: string) {
  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return null;
    }

    return user;
  } catch (err: any) {
    throw err.message;
  }
}

async function validateUserPackages(userId: string) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      return;
    }

    if (!user.paymentId || user.paymentId.length === 0) {
      return;
    }

    const payments = await Payment.find({ _id: { $in: user.paymentId } });

    const currentDate = new Date();

    const validPayments = payments.filter((paymentDoc) => {
      return (
        paymentDoc.status === "success" &&
        paymentDoc.endsAt &&
        new Date(paymentDoc.endsAt) > currentDate
      );
    });

    const expiredPayments = payments.filter((paymentDoc) => {
      return (
        paymentDoc.status === "success" &&
        paymentDoc.endsAt &&
        new Date(paymentDoc.endsAt) <= currentDate
      );
    });

    const validPackageIds = validPayments.map(
      (paymentDoc) => paymentDoc.package
    );

    const validPackages = await Package.find({
      _id: { $in: validPackageIds },
    });

    const validPackageIdsToKeep = validPackages.map((pkg) => pkg._id);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          packageId: validPackageIdsToKeep,
        },
        $pull: {
          paymentId: { $in: expiredPayments.map((payment) => payment._id) },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("Error updating user packages");
    }

    return updatedUser;
  } catch (err: any) {
    throw new Error(`Error validating user packages: ${err.message}`);
  }
}

export {
  createUser,
  updateUser,
  deleteUser,
  findUserByEmail,
  findUserByUsername,
  getUserRole,
  findUserById,
  validateUserPackages,
};
