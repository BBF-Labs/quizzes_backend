import { Router, Request, Response } from "express";
import { authenticateUser, authorizeRoles } from "../middlewares";
import {
  createPackage,
  getPackageDetails,
  getPackages,
  getPackageByDiscountCode,
  updatePackage,
} from "../controllers";
import { StatusCodes } from "../config";

const packageRoutes: Router = Router();

// Normalize Express params that may be string | string[] | ParsedQs
const asString = (val: unknown): string | undefined => {
  if (Array.isArray(val)) return asString(val[0]);
  return typeof val === "string" ? val : undefined;
};

/**
 * @swagger
 * /api/v1/packages:
 *   get:
 *     summary: Get all packages
 *     description: Get all packages
 *     tags:
 *      - Packages
 *     responses:
 *       200:
 *         description: Successfully retrieved all packages
 *       500:
 *         description: Internal server error
 */
packageRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const packages = await getPackages();

    res.status(StatusCodes.OK).json({ message: "Success", package: packages });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: `Error fetching packages: ${err.message}` });
  }
});

/**
 * @swagger
 * /api/v1/packages/{id}:
 *   get:
 *     summary: Get package details by ID
 *     description: Get package details by ID
 *     tags:
 *      - Packages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Successfully retrieved package details
 *       400:
 *         description: Package ID is required
 *       404:
 *         description: Package not found
 *       500:
 *         description: Internal server error
 */
packageRoutes.get("/:id", async (req: Request, res: Response) => {
  try {
    const packageId = asString(req.params.id);

    if (!packageId) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Package ID is required" });
      return;
    }

    const packageDetails = await getPackageDetails(packageId);

    if (!packageDetails) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Package not found" });
      return;
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Package found", package: packageDetails });
  } catch (err: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: `Error fetching package details: ${err.message}` });
  }
});

/**
 * @swagger
 * /api/v1/packages/discount/{code}:
 *   get:
 *     summary: Get package by discount code
 *     description: Get package by discount code
 *     tags:
 *      - Packages
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         description: Discount code
 *     responses:
 *       200:
 *         description: Successfully retrieved package by discount code
 *       400:
 *         description: Discount code is required
 *       404:
 *         description: Package with the given discount code not found
 *       500:
 *         description: Internal server error
 */
packageRoutes.get("/discount/:code", async (req: Request, res: Response) => {
  try {
    const discountCode = asString(req.params.code);

    if (!discountCode) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Discount code is required" });
      return;
    }

    const packageByDiscountCode = await getPackageByDiscountCode(discountCode);

    if (!packageByDiscountCode) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Package with the given discount code not found" });
      return;
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Package found", package: packageByDiscountCode });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: `Error fetching package by discount code: ${err.message}`,
    });
  }
});

/**
 * @swagger
 * /api/v1/packages/create:
 *   post:
 *     summary: Create a new package
 *     description: Create a new package (Admin only)
 *     tags:
 *      - Packages
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Successfully created package
 *       400:
 *         description: Package data is required
 *       500:
 *         description: Internal server error
 */
packageRoutes.post(
  "/create",
  authenticateUser,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const newPackage = req.body;

      if (!newPackage) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Package data is required" });
        return;
      }

      const createdPackage = await createPackage(newPackage);

      res
        .status(StatusCodes.CREATED)
        .json({ message: "Package created", package: createdPackage });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `Error creating package: ${err.message}` });
    }
  },
);

/**
 * @swagger
 * /api/v1/packages/update/{id}:
 *   put:
 *     summary: Update a package
 *     description: Update an existing package (Admin only)
 *     tags:
 *      - Packages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Package ID
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully updated package
 *       400:
 *         description: Package ID and data are required
 *       404:
 *         description: Package not found to update
 *       500:
 *         description: Internal server error
 */
packageRoutes.put(
  "/update/:id",
  authenticateUser,
  authorizeRoles("admin"),
  async (req: Request, res: Response) => {
    try {
      const packageId = asString(req.params.id);
      const updatedPackageData = req.body;

      if (!packageId || !updatedPackageData) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Package ID and data are required" });
        return;
      }
      const updatedPackage = await updatePackage(packageId, updatedPackageData);

      if (!updatedPackage) {
        res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "Package not found to update" });
        return;
      }

      res
        .status(StatusCodes.OK)
        .json({ message: "Package updated", package: updatedPackage });
    } catch (err: any) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `Error updating package: ${err.message}` });
    }
  },
);

export default packageRoutes;
