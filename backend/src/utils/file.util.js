const fs = require("fs");
const path = require("path");

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = getFileExtension(originalName);
  const nameWithoutExt = path.basename(originalName, ext);

  // Remove special characters and spaces
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");

  return `${cleanName}_${timestamp}_${random}${ext}`;
};

const isImageFile = (filename) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext);
};

const getFileSizeInMB = (sizeInBytes) => {
  return (sizeInBytes / (1024 * 1024)).toFixed(2);
};

module.exports = {
  deleteFile,
  getFileExtension,
  generateUniqueFilename,
  isImageFile,
  getFileSizeInMB,
};
