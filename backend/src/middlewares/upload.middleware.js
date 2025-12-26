const multer = require("multer");
const path = require("path");
const { generateUniqueFilename, isImageFile } = require("../utils/file.util");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars/");
  },
  filename: function (req, file, cb) {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (!isImageFile(file.originalname)) {
    return cb(
      new Error("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)"),
      false
    );
  }
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware for single avatar upload
const uploadAvatar = upload.single("avatar");

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File quá lớn. Kích thước tối đa là 5MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

module.exports = {
  uploadAvatar,
  handleUploadError,
};
