import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname } from "path";
import { randomBytes } from "crypto";

// Create uploads directory if it doesn't exist
const uploadDir = "dist/public/uploads";
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate random filename to prevent collisions
    const randomName = randomBytes(16).toString("hex");
    const extension = extname(file.originalname);
    cb(null, `${randomName}${extension}`);
  },
});

// Configure file filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only PDF, JPG, JPEG, and PNG files
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
