// src/config/multer.config.ts
import multer from "multer";
import path from "path";

// Configure storage for Excel files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "numbers-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter for Excel files only
const fileFilter = (req: any, file: any, cb: any) => {
  if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "application/vnd.ms-excel.sheet.macroEnabled.12"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed"), false);
  }
};

export const multerFileUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});