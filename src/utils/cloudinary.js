import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// console.log("Cloudinary ENV check:", {
//   cloud: process.env.CLOUDINARY_CLOUD_NAME,
//   key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
//   secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING",
// });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("Uploading file path:", localFilePath);

    if (!localFilePath) return null;

    if (!fs.existsSync(localFilePath)) {
      console.error("FILE DOES NOT EXIST:", localFilePath);
      return null;
    }

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return result;

  } catch (error) {
    console.error("CLOUDINARY ERROR FULL:", error);
    return null;
  }
};

export { uploadOnCloudinary };

