import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Formato de imagen no permitido"), false);
  }
  return cb(null, true);
};

export const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024
  },
  fileFilter
});
