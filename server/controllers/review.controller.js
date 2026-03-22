import { errorRes, successRes } from "../lib/res.js";
import Review from "../models/Review.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatReply(reply) {
  const author =
    typeof reply?.user?.username === "string" && reply.user.username.trim()
      ? reply.user.username.trim()
      : typeof reply?.user?.name === "string" && reply.user.name.trim()
        ? reply.user.name.trim()
        : "User";

  return {
    _id: String(reply?._id ?? ""),
    author,
    username: reply?.user.username,
    text: typeof reply?.message === "string" ? reply.message.trim() : "",
    date: reply?.createdAt ? new Date(reply.createdAt).toISOString() : "",
    likes: Number(reply?.likes ?? 0),
    userId: reply?.user?._id ? String(reply.user._id) : null,
  };
}

function formatReview(review, options = {}) {
  const text =
    typeof review?.message === "string" && review.message.trim() ? review.message.trim() : "";
  const author =
    typeof review?.user?.username === "string" && review.user.username.trim()
      ? review.user.username.trim()
      : typeof review?.user?.name === "string" && review.user.name.trim()
        ? review.user.name.trim()
        : "User";
  const includeReplies = options.includeReplies === true;
  const replies = Array.isArray(review?.replies) ? review.replies : [];

  return {
    _id: String(review?._id ?? ""),
    author,
    username: review?.user.username,
    text,
    date: review?.createdAt ? new Date(review.createdAt).toISOString() : "",
    imageUrl: null,
    likes: Number(review?.likes ?? 0),
    userId: review?.user?._id ? String(review.user._id) : null,
    movieImdbId: review?.movieImdbId ?? "",
    movieTitle: review?.movieTitle ?? "",
    replyCount: replies.length,
    replies: includeReplies ? replies.map(formatReply) : [],
  };
}

async function findFormattedReviewById(reviewId) {
  const review = await Review.findById(reviewId)
    .populate("user", "name username email")
    .populate("replies.user", "name username email")
    .lean();

  return review ? formatReview(review) : null;
}

export const listReviews = async (req, res) => {
  try {
    const imdbId = typeof req.query.imdbId === "string" ? req.query.imdbId.trim() : "";

    const filter = imdbId
      ? { movieImdbId: { $regex: `^${escapeRegex(imdbId)}$`, $options: "i" } }
      : {};

    const reviews = await Review.find(filter)
      .populate("user", "name username")
      .sort({ createdAt: -1 })
      .lean();

    return successRes(res, 200, "Reviews fetched successfully", {
      reviews: reviews.map((review) => formatReview(review)).filter((review) => review.text),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch reviews";
    return errorRes(res, 500, message);
  }
}

export async function saveReview(req, res) {
  try {
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const movieImdbId =
      typeof req.body?.movieImdbId === "string" ? req.body.movieImdbId.trim() : "";
    const movieTitle = typeof req.body?.movieTitle === "string" ? req.body.movieTitle.trim() : "";

    if (!message) {
      return errorRes(res, 400, "message is required");
    }

    if (reviewId) {
      const review = await Review.findById(reviewId);
      if (!review) return errorRes(res, 404, "Review not found");

      if (String(review.user) !== String(req.auth.userId)) {
        return errorRes(res, 403, "You can only edit your own review");
      }

      review.message = message;

      if (movieTitle) review.movieTitle = movieTitle;
      await review.save();
      const formattedReview = await findFormattedReviewById(review._id);

      return successRes(res, 200, "Review saved successfully", {
        review: formattedReview,
      });
    }

    if (!movieImdbId) {
      return errorRes(res, 400, "movieImdbId is required");
    }

    const existingReview = await Review.findOne({
      movieImdbId,
      user: req.auth.userId,
    }).lean();

    if (existingReview) {
      return errorRes(res, 409, "You have already reviewed this movie");
    }

    const review = await Review.create({
      movieImdbId,
      movieTitle,
      user: req.auth.userId,
      message,
      likes: 0,
      likedBy: [],
      replies: [],
    });

    const formattedReview = await findFormattedReviewById(review._id);

    return successRes(res, 201, "Review saved successfully", {
      review: formattedReview,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return errorRes(res, 409, "You have already reviewed this movie");
    }

    const message =
      error instanceof Error ? error.message : "Failed to save review";
    return errorRes(res, 500, message);
  }
}

export async function deleteReview(req, res) {
  try {
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";

    if (!reviewId) {
      return errorRes(res, 400, "reviewId is required");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    if (String(review.user) !== String(req.auth.userId)) {
      return errorRes(res, 403, "You can only delete your own review");
    }

    await review.deleteOne();

    return successRes(res, 200, "Review deleted successfully", {
      deleted: true,
      reviewId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete review";
    return errorRes(res, 500, message);
  }
}

export async function likeReview(req, res) {
  try {
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";
    if (!reviewId) {
      return errorRes(res, 400, "reviewId is required");
    }

    const existingReview = await Review.findById(reviewId).select("likes likedBy");
    if (!existingReview) {
      return errorRes(res, 404, "Review not found");
    }

    const hasLiked = Array.isArray(existingReview.likedBy)
      && existingReview.likedBy.some((userId) => String(userId) === String(req.auth.userId));

    const update = hasLiked
      ? {
          $pull: { likedBy: req.auth.userId },
          $inc: { likes: -1 },
        }
      : {
          $addToSet: { likedBy: req.auth.userId },
          $inc: { likes: 1 },
        };

    await Review.updateOne(
      { _id: reviewId },
      update,
    );

    const review = await Review.findById(reviewId).select("likes");
    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    return successRes(res, 200, hasLiked ? "Review dislike successful" : "Review liked successfully", {
      totalLikes: Math.max(Number(review.likes ?? 0), 0),
      liked: !hasLiked,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to like review";
    return errorRes(res, 500, message);
  }
}

export async function addReply(req, res) {
  try {
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!reviewId) {
      return errorRes(res, 400, "reviewId is required");
    }

    if (!message) {
      return errorRes(res, 400, "message is required");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    review.replies.push({
      user: req.auth.userId,
      message,
      likes: 0,
      likedBy: [],
    });
    await review.save();

    const populatedReview = await Review.findById(reviewId)
      .populate("replies.user", "name username")
      .lean();
    const latestReply = populatedReview?.replies?.[populatedReview.replies.length - 1];

    return successRes(res, 200, "Reply added successfully", {
      reply: latestReply ? formatReply(latestReply) : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reply to review";
    return errorRes(res, 500, message);
  }
}

export async function listReplies(req, res) {
  try {
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";

    if (!reviewId) {
      return errorRes(res, 400, "reviewId is required");
    }

    const review = await Review.findById(reviewId)
      .populate("user", "name username")
      .populate("replies.user", "name username")
      .lean();

    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    return successRes(res, 200, "Replies fetched successfully", {
      review: formatReview(review, { includeReplies: false }),
      replies: Array.isArray(review.replies) ? review.replies.map(formatReply) : [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch replies";
    return errorRes(res, 500, message);
  }
}

export async function likeReply(req, res) {
  try {
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";
    const replyId = typeof req.params?.replyId === "string" ? req.params.replyId.trim() : "";

    if (!reviewId || !replyId) {
      return errorRes(res, 400, "reviewId and replyId are required");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    const reply = review.replies.id(replyId);
    if (!reply) {
      return errorRes(res, 404, "Reply not found");
    }

    const hasLiked = Array.isArray(reply.likedBy)
      && reply.likedBy.some((userId) => String(userId) === String(req.auth.userId));

    if (hasLiked) {
      reply.likedBy = reply.likedBy.filter((userId) => String(userId) !== String(req.auth.userId));
      reply.likes = Math.max(Number(reply.likes ?? 0) - 1, 0);
    } else {
      reply.likedBy.push(req.auth.userId);
      reply.likes = Number(reply.likes ?? 0) + 1;
    }

    await review.save();

    return successRes(res, 200, hasLiked ? "Reply dislike successful" : "Reply liked successfully", {
      totalLikes: Number(reply.likes ?? 0),
      liked: !hasLiked,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to like reply";
    return errorRes(res, 500, message);
  }
}

export async function deleteReply(req, res) {
  try {
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";
    const replyId = typeof req.params?.replyId === "string" ? req.params.replyId.trim() : "";

    if (!reviewId || !replyId) {
      return errorRes(res, 400, "reviewId and replyId are required");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    const reply = review.replies.id(replyId);
    if (!reply) {
      return errorRes(res, 404, "Reply not found");
    }

    if (String(reply.user) !== String(req.auth.userId)) {
      return errorRes(res, 403, "You can only delete your own reply");
    }

    review.replies.pull(replyId);
    await review.save();

    return successRes(res, 200, "Reply deleted successfully", {
      replyId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete reply";
    return errorRes(res, 500, message);
  }
}
