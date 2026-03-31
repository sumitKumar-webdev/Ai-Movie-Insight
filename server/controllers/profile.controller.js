import User from "../models/User.js";
import { sendUsernameChangedEmail } from "../lib/email.js";
import { errorRes, successRes } from "../lib/res.js";
import { isValidUsername, sanitizeUser } from "../lib/user-profile.js";

export const getProfile = async (req, res) => {
  try {
    const user = req.user ? await User.findById(req.user._id) : null;
    if (!user) {
      return errorRes(res, 401, "Unauthorized");
    }

    return successRes(res, 200, "Profile fetched successfully", {
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch profile";
    return errorRes(res, 500, message);
  }
};

export const saveProfile = async (req, res) => {
  try {
    const user = req.user ? await User.findById(req.user._id) : null;
    if (!user) {
      return errorRes(res, 401, "Unauthorized");
    }

    const name = String(req.body?.name ?? "").trim();
    const username = String(req.body?.username ?? "").trim();

    if (!name) {
      return errorRes(res, 400, "Full name is required");
    }

    if (name.length < 2 || name.length > 60) {
      return errorRes(res, 400, "Full name must be between 2 and 60 characters");
    }

    if (!username) {
      return errorRes(res, 400, "Username is required");
    }

    if (!isValidUsername(username)) {
      return errorRes(
        res,
        400,
        "Username must be 3 to 20 characters and use only letters, numbers, or underscores",
      );
    }

    const existingUser = await User.findOne({
      username,
      _id: { $ne: user._id },
    }).lean();

    if (existingUser) {
      return errorRes(res, 409, "This username is already taken");
    }

    const previousUsername = user.username ?? "";
    const usernameChanged = previousUsername !== username;

    user.name = name;
    user.username = username;
    await user.save();

    if (usernameChanged) {
      await sendUsernameChangedEmail(user.email, user.name, {
        previousUsername,
        username,
      });
    }

    return successRes(res, 200, "Profile saved successfully", {
      user: sanitizeUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save profile";
    return errorRes(res, 500, message);
  }
};
