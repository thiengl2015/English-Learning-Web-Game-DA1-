const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

/**
 * Upload a file buffer to Cloudinary and resolve with the stored info.
 * @param {Buffer} buffer raw file bytes (from multer memory storage)
 * @param {object} opts { folder, resourceType }
 * @returns {Promise<{ url: string, public_id: string }>}
 */
const uploadBuffer = (buffer, { folder = "english-learning", resourceType = "auto" } = {}) =>
  new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(new Error("Cloudinary chưa được cấu hình (thiếu biến môi trường)"));
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });

module.exports = { cloudinary, isConfigured, uploadBuffer };
