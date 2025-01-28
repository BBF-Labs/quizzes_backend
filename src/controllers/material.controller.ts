import { Material } from "../models";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FirebaseConfig } from "../config";
import { initializeApp } from "firebase/app";
import { findUserByUsername } from "./user.controller";

interface FileUpload {
  buffer: Buffer;
  filename: string;
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
    if (!file) {
      throw new Error("No file provided");
    }

    const user = await findUserByUsername(username);

    if (!user) {
      throw new Error("User not found");
    }

    const filename = `${user.username}-${Date.now()}-${file.filename}`;

    const storageRef = ref(storage, `materials/${filename}`);

    await uploadBytes(storageRef, file.buffer);

    const url = await getDownloadURL(storageRef);

    const material = new Material({
      title: file.filename,
      url: url,
      type: getFileType(file.mimetype, file.filename),
      uploadedBy: user._id,
      courseId: courseId,
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

export { uploadMaterial, getMaterials, getUserMaterials, getCourseMaterials };
