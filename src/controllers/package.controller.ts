import { Package, Payment } from "../models";
import { IPackage } from "../interfaces";

async function createPackage(data: Partial<IPackage>) {
  try {
    const existingPackage = await Package.findOne({
      name: data.name,
    });

    if (existingPackage) {
      throw new Error("Package already exists");
    }

    const packageDoc = new Package(data);

    await packageDoc.save();
    return packageDoc;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function updatePackage(id: string, data: Partial<IPackage>) {
  try {
    const packageDoc = await Package.findById(id);

    if (!packageDoc) {
      throw new Error("Package not found");
    }

    const updatedPackage = await Package.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return updatedPackage;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getPackageDetails(id: string) {
  try {
    const packageDoc = await Package.findById(id);

    if (!packageDoc) {
      throw new Error("Package not found");
    }

    const {
      name,
      price,
      duration,
      isUpgradable,
      numberOfCourses,
      courses,
      numberOfQuizzes,
      quizzes,
      discountCode,
      discountPercentage,
      _id,
    } = packageDoc;

    const packageData = {
      id: _id,
      name: name,
      price: price,
      duration: duration,
      isUpgradable: isUpgradable,
      numberOfCourses: numberOfCourses,
      courses: courses,
      numberOfQuizzes: numberOfQuizzes,
      quizzes: quizzes,
      discountCode: discountCode,
      discountPercentage: discountPercentage,
    };

    return packageData;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getPackages() {
  try {
    const packages = await Package.find();

    return packages;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getPackageByDiscountCode(code: string) {
  try {
    const packageDoc = await Package.findOne({ discountCode: code });

    if (!packageDoc) {
      throw new Error("Package not found");
    }

    const {
      name,
      price,
      duration,
      isUpgradable,
      numberOfCourses,
      courses,
      numberOfQuizzes,
      quizzes,
      discountCode,
      discountPercentage,
      _id,
    } = packageDoc;

    const packageData = {
      id: _id,
      name: name,
      price: price,
      duration: duration,
      isUpgradable: isUpgradable,
      numberOfCourses: numberOfCourses,
      courses: courses,
      numberOfQuizzes: numberOfQuizzes,
      quizzes: quizzes,
      discountCode: discountCode,
      discountPercentage: discountPercentage,
    };

    return packageData;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export {
  createPackage,
  updatePackage,
  getPackageDetails,
  getPackages,
  getPackageByDiscountCode,
};
