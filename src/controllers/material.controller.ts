import { Material } from "../models";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FirebaseConfig } from "../config";
import { initializeApp } from "firebase/app";
import { findUserByUsername } from "./user.controller";

interface FileUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

const app = initializeApp(FirebaseConfig);
const storage = getStorage(app);

const getFileType = (mimeType: string, filename: string) => {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("doc")) return "doc";
  if (mimeType.includes("image")) return "img";
  if (filename.endsWith(".ppt") || filename.endsWith(".pptx")) return "slides";
  return "text";
};

async function uploadMaterial(
  file: FileUpload,
  courseId: string,
  username: string
) {
  try {
    if (!file || !file.originalname || !file.buffer) {
      throw new Error("Invalid file data provided");
    }

    const user = await findUserByUsername(username);

    if (!user) {
      throw new Error("User not found");
    }

    const title = file.originalname;
    if (!title) {
      throw new Error("File title is required");
    }

    const filename = `${user.username}-${Date.now()}-${title}`;
    const storageRef = ref(storage, `materials/${filename}`);

    await uploadBytes(storageRef, file.buffer);
    const url = await getDownloadURL(storageRef);

    const fileType = getFileType(file.mimetype, file.originalname);

    const material = new Material({
      title: title.trim(),
      url: url,
      type: fileType,
      uploadedBy: user._id,
      courseId: courseId,
    });

    const validationError = material.validateSync();
    if (validationError) {
      throw new Error(`Validation failed: ${validationError.message}`);
    }

    await material.save();
    return material;
  } catch (err: any) {
    console.error("Material upload error:", err);
    throw new Error(err.message || "Error uploading material");
  }
}

async function getMaterials() {
  try {
    const materials = await Material.find();
    return materials;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getUserMaterials(username: string) {
  try {
    const user = await findUserByUsername(username);

    if (!user) {
      throw new Error("User not found");
    }

    const materials = await Material.find({ uploadedBy: user._id })
      .populate("uploadedBy")
      .populate("courseId");

    return materials;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

async function getCourseMaterials(courseId: string) {
  try {
    const materials = await Material.find({ courseId: courseId })
      .populate("uploadedBy")
      .populate("courseId");
    return materials;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export { uploadMaterial, getMaterials, getUserMaterials, getCourseMaterials };
