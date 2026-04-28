import User from "../models/User.js";
import { sendUsernameChangedEmail } from "../lib/email.js";
import { errorRes, successRes } from "../lib/res.js";
import { isValidUsername, sanitizePublicUser, sanitizeUser } from "../lib/user-profile.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

export const getPublicProfile = async (req, res) => {
  try {
    const username = String(req.params?.username ?? "").trim();

    if (!username) {
      return errorRes(res, 400, "username is required");
    }

    if (!isValidUsername(username)) {
      return errorRes(
        res,
        400,
        "Username must be 3 to 20 characters and use only letters, numbers, or underscores",
      );
    }

    const user = await User.findOne({
      username: {
        $regex: `^${escapeRegex(username)}$`,
        $options: "i",
      },
    });

    if (!user) {
      return errorRes(res, 404, "Profile not found");
    }

    return successRes(res, 200, "Profile fetched successfully", {
      user: sanitizePublicUser(user),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch profile";
    return errorRes(res, 500, message);
  }
};

export const searchPublicProfiles = async (req, res) => {
  try {
    const query = String(req.query.q ?? "").trim();

    if (query.length < 2) {
      return successRes(res, 200, "Profiles fetched successfully", {
        users: [],
      });
    }

    const matcher = {
      $regex: escapeRegex(query),
      $options: "i",
    };

    const users = await User.find({
      username: { $exists: true, $ne: null, ...matcher },
    })
      .select("name username avatar is_verified")
      .limit(8)
      .lean();

    const normalizedQuery = query.toLowerCase();
    const sanitizedUsers = users
      .map((user) => sanitizePublicUser(user))
      .sort((left, right) => {
        const leftUsername = left.username.toLowerCase();
        const rightUsername = right.username.toLowerCase();
        const leftStartsWith = leftUsername.startsWith(normalizedQuery);
        const rightStartsWith = rightUsername.startsWith(normalizedQuery);

        if (leftStartsWith !== rightStartsWith) {
          return leftStartsWith ? -1 : 1;
        }

        return leftUsername.localeCompare(rightUsername);
      });

    return successRes(res, 200, "Profiles fetched successfully", {
      users: sanitizedUsers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search profiles";
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
