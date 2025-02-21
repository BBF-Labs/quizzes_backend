import { User, Package, Payment, Question, QuizQuestion } from "../models";
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
    if (!user) throw new Error("User not found");

    if (user.role === "admin") return;

    const currentDate = new Date();

    const payments = await Payment.find({
      _id: { $in: user.paymentId },
      status: "success",
    });

    const validPayments = payments.filter(
      (payment) => payment.endsAt! > currentDate
    );
    const expiredPayments = payments.filter(
      (payment) => payment.endsAt! <= currentDate
    );

    const validPackageIds = validPayments.map((p) => p.package);
    const packages = await Package.find({ _id: { $in: validPackageIds } });

    const validPackageIdsToKeep = new Set<string>();
    const coursesToAdd = new Set<string>(
      user.courses?.map((c) => c.toString()) || []
    );

    for (const pkg of packages) {
      const userPayment = validPayments.find(
        (p) => p.package.toString() === pkg._id.toString()
      );

      if (!userPayment) continue;

      if (pkg.access === "duration" && pkg.duration) {
        const paymentStartDate = new Date(userPayment.date);
        const packageExpiryDate = new Date(paymentStartDate);
        packageExpiryDate.setDate(packageExpiryDate.getDate() + pkg.duration);

        if (packageExpiryDate > currentDate) {
          validPackageIdsToKeep.add(pkg._id.toString());
        }
      } else {
        validPackageIdsToKeep.add(pkg._id.toString());
      }

      if (pkg.access !== "quiz" && pkg.courses) {
        pkg.courses.forEach((courseId) =>
          coursesToAdd.add(courseId.toString())
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          packageId: Array.from(validPackageIdsToKeep),
          courses: Array.from(coursesToAdd),
        },
        $pull: { paymentId: { $in: expiredPayments.map((p) => p._id) } },
      },
      { new: true }
    );

    if (!updatedUser) throw new Error("Error updating user packages");

    const hasValidPayments = validPayments.length > 0;
    const hasQuizCredits = (updatedUser.quizCredits ?? 0) > 0;
    const hasValidPackages = validPackageIdsToKeep.size > 0;

    if (hasValidPayments && hasValidPackages) {
      const latestPayment = validPayments[validPayments.length - 1];
      const latestPackage = packages.find(
        (pkg) => pkg._id.toString() === latestPayment.package.toString()
      );

      await User.updateOne(
        { _id: userId },
        {
          $set: {
            isSubscribed: true,
            accessType: latestPackage?.access || "duration",
          },
        }
      );
    } else if (hasValidPayments) {
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            isSubscribed: true,
            accessType: "default",
          },
        }
      );
    } else {
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            isSubscribed: false,
            accessType: "default",
          },
        }
      );
    }

    return updatedUser;
  } catch (err: any) {
    throw new Error(`Error validating user packages: ${err.message}`);
  }
}

function creditHoursToQuizCredits(creditHours: number): number {
  if (creditHours === 1) {
    return 1.25 * 100;
  } else if (creditHours === 2) {
    return 2 * 100;
  } else if (creditHours === 3) {
    return 3 * 100;
  } else {
    return 300;
  }
}

async function validateUserQuizAccess(username: string, quizId: string) {
  try {
    const [quizDoc, user] = await Promise.all([
      QuizQuestion.findById(quizId),
      User.findOne({ username }),
    ]);

    if (!quizDoc) {
      throw new Error("Quiz not found");
    }

    if (!user) {
      throw new Error("User  not found");
    }

    if (user.role === "admin") {
      return;
    }

    if (user.isBanned) {
      throw new Error("User  is banned");
    }

    if (user.isDeleted) {
      throw new Error("No user found");
    }

    if (
      user.accessType === "default" &&
      !user.hasFreeAccess &&
      (user.quizCredits ?? 0) === 0
    ) {
      throw new Error("User  does not have access to this quiz");
    }

    if (user.hasFreeAccess) {
      if (user.freeAccessCount! > 0) {
        const newFreeAccessCount =
          user.freeAccessCount === 1 ? 0 : user.freeAccessCount! - 1;
        const hasFreeAccess = newFreeAccessCount > 0;

        await User.updateOne(
          { username: user.username },
          { freeAccessCount: newFreeAccessCount, hasFreeAccess }
        );
        return;
      } else {
        throw new Error("User  has no free access left to take the quiz");
      }
    }

    const validateUserPackageStat = await validateUserPackages(
      user._id.toString()
    );
    if (!validateUserPackageStat) {
      throw new Error("Error validating user packages");
    }

    if (user.accessType === "duration") {
      if (!user.isSubscribed) {
        throw new Error("Renew Subscription");
      }
      return;
    }

    if (user.accessType === "course") {
      if (!user.courses || !user.courses.includes(quizDoc.courseId)) {
        throw new Error("User  does not have access to this quiz");
      }
    }

    const questionIds = quizDoc.quizQuestions.flatMap(
      (filteredQuestion) => filteredQuestion.questions
    );
    const moderatedQuestionsCount = await Question.countDocuments({
      _id: { $in: questionIds },
      moderatedBy: user._id,
    });

    if (moderatedQuestionsCount >= 5) {
      return;
    }

    const quizCredits = creditHoursToQuizCredits(quizDoc.creditHours);
    const currentQuizCredits = user.quizCredits ?? 0;

    if (currentQuizCredits >= quizCredits) {
      await User.updateOne(
        { username },
        { quizCredits: currentQuizCredits - quizCredits }
      );
      return;
    } else {
      throw new Error("Insufficient quiz credits");
    }
  } catch (err: any) {
    throw new Error(`Error validating user quiz access: ${err.message}`);
  }
}

async function getUsers() {
  try {
    const users = await User.find();

    if (!users) {
      throw new Error("No users found");
    }

    return users;
  } catch (err: any) {
    throw new Error(`Error getting users: ${err.message}`);
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
  validateUserQuizAccess,
  getUsers,
};
