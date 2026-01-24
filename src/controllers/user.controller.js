import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";


const generateAccessTokenAndRefreshToken = async(userId) => {
  try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false});

      return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};



const registerUser = asyncHandler(async (req, res) => {

  //  Get data from request body
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //  Validate uploaded files
  if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatarLocalPath = req.files.avatar[0].path;
  const coverImageLocalPath = req.files.coverImage?.[0]?.path || null;

  //  Upload avatar to Cloudinary
  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);

  if (!avatarUpload) {
    throw new ApiError(400, "Failed to upload avatar image");
  }

  //  Upload cover image (optional)
  let coverImageUpload = null;
  if (coverImageLocalPath) {
    coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
  }

  //  Create user in DB
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarUpload.url,
    coverImage: coverImageUpload?.url || "",
  });

  //  Remove sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -watchHistory"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  // Send response
  return res.status(201).json(
    new ApiResponse(
      201,
      createdUser,
      "User registered successfully"
    )
  );
});

const loginUser = asyncHandler(async (req, res) => {
  // Implementation for user login
  const { email, username, password } = req.body

  if ( !email && !username ) {
    throw new ApiError(400, "Email or username is required");
  }

   const user = await User.findOne({
    $or: [{ email }, { username }]
    })

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -watchHistory"
  );
  
  const options = {
    httpOnly: true,
    secure: true,
  }

   return res
   .status(200)
   .cookie("refreshToken", refreshToken, options)
   .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
           user: loggedInUser, accessToken, refreshToken 
        },
        "User logged in successfully"
      )
    );
})

const logoutUser = asyncHandler(async (req, res) => {
  // Implementation for user logout
   await User.findByIdAndUpdate(req.user._id,
     {
       $set:{
        refreshToken: undefined 
       }
      },
      { new: true }
    )
    const options = {
    httpOnly: true,
    secure: true,
    }
    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        "User logged out successfully"
      )
    );

}); 

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.
   refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

try {
       const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      )
      const user = await User.findById(decodedToken?._id);
      if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
      if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
    const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);
  
    const options = {
      httpOnly: true,
      secure: true,
    }
  
     return res
     .status(200)
     .cookie("refreshToken", newRefreshToken, options)
     .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          {
             accessToken, refreshToken: newRefreshToken 
          },
          "Access token refreshed successfully"
        )
      );
} catch (error) {
   throw new ApiError(401, error?.message || "Invalid refresh token");
}
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Implementation for changing current password
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid current password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // Implementation for getting current user
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // Implementation for updating account details
  const { fullName,  email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "Full name and email are required");
  }
   const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email
      }
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Implementation for updating user avatar
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Failed to upload avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  // Implementation for updating user cover image
  const coverImageLocalPath = req.file?.path;
  
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Failed to upload cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    }; 
