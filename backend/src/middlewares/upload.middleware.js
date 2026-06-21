const multer = require("multer");
const { isImageFile } = require("../utils/file.util");

const memoryStorage = multer.memoryStorage();

const isImageUpload = (file) =>
  Boolean(
    file?.mimetype?.startsWith("image/") &&
      isImageFile(file.originalname || "")
  );

const isAudioUpload = (file) => Boolean(file?.mimetype?.startsWith("audio/"));

const avatarFileFilter = (req, file, cb) => {
  if (!isImageUpload(file)) {
    return cb(
      new Error("Only image files are accepted (jpg, jpeg, png, gif, webp)"),
      false
    );
  }
  cb(null, true);
};

const mediaFileFilter = (req, file, cb) => {
  if (!isImageUpload(file) && !isAudioUpload(file)) {
    return cb(new Error("Only image and audio files are accepted"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: memoryStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const chatUpload = multer({
  storage: memoryStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Resource media (vocabulary/grammar images and audio) stays in memory so the
// buffer can be streamed straight to Cloudinary.
const resourceMediaUpload = multer({
  storage: memoryStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const uploadAvatar = upload.single("avatar");
const uploadChatMedia = chatUpload.single("media");
const uploadResourceMedia = resourceMediaUpload.single("file");

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large for this upload endpoint",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
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
  uploadChatMedia,
  uploadResourceMedia,
  handleUploadError,
};
