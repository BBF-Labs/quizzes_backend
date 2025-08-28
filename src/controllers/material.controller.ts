import { Material } from "../models";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FirebaseConfig } from "../config";
import { initializeApp } from "firebase/app";
import { findUserByUsername } from "./user.controller";
import { IMaterial } from "../interfaces";

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
  if (mimeType.includes("json") || filename.endsWith(".json")) return "data";
  if (filename.endsWith(".ppt") || filename.endsWith(".pptx")) return "slides";
  return "text";
};

async function uploadMaterial(
  file: FileUpload,
  courseId: string,
  username: string,
  questionRefType: string
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
      questionRefType: questionRefType,
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

async function createLinkMaterial(
  username: string,
  courseId: string,
  data: Partial<IMaterial | any>
) {
  try {
    const user = await findUserByUsername(username);

    if (!user) {
      throw new Error("User not found");
    }

    const material = new Material({
      title: data.title,
      url: data.link,
      type: "link",
      uploadedBy: user._id,
      courseId: courseId,
      questionRefType: data.questionRefType,
    });

    await material.save();

    return material;
  } catch (err: any) {
    throw new Error(err.message);
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

export {
  uploadMaterial,
  getMaterials,
  getUserMaterials,
  getCourseMaterials,
  createLinkMaterial,
};
