const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const configurationError = () => {
  const error = new Error(
    "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
  );
  error.statusCode = 503;
  error.code = "CLOUDINARY_NOT_CONFIGURED";
  return error;
};

/**
 * Upload a file buffer to Cloudinary and resolve with the stored info.
 * @param {Buffer} buffer raw file bytes from multer memory storage
 * @param {object} opts upload options
 * @returns {Promise<{ url: string, public_id: string, resource_type: string }>}
 */
const uploadBuffer = (
  buffer,
  {
    folder = "english-learning",
    resourceType = "auto",
    publicId,
    overwrite,
  } = {}
) =>
  new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(configurationError());
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(publicId ? { public_id: publicId, unique_filename: false } : {}),
        ...(overwrite !== undefined ? { overwrite } : {}),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        });
      }
    );
    stream.end(buffer);
  });

const isCloudinaryUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "cloudinary.com" ||
        parsed.hostname.endsWith(".cloudinary.com"))
    );
  } catch {
    return false;
  }
};

const extractPublicIdFromUrl = (value) => {
  if (!isCloudinaryUrl(value)) return null;

  const parsed = new URL(value);
  const parts = parsed.pathname.split("/").filter(Boolean);
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;

  const versionIndex = parts.findIndex(
    (part, index) => index > uploadIndex && /^v\d+$/.test(part)
  );
  const publicParts =
    versionIndex === -1
      ? parts.slice(uploadIndex + 1)
      : parts.slice(versionIndex + 1);

  if (publicParts.length === 0) return null;

  const publicIdWithExt = decodeURIComponent(publicParts.join("/"));
  return publicIdWithExt.replace(/\.[a-zA-Z0-9]+$/, "");
};

const deleteByUrl = async (url, resourceType = "image") => {
  if (!isConfigured() || !isCloudinaryUrl(url)) return false;

  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return false;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
  return true;
};

module.exports = {
  cloudinary,
  deleteByUrl,
  extractPublicIdFromUrl,
  isCloudinaryUrl,
  isConfigured,
  uploadBuffer,
};
