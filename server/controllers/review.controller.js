import { errorRes, successRes } from "../lib/res.js";
import Review from "../models/Review.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatReply(reply) {
  return {
    _id: String(reply?._id ?? ""),
    author: reply?.user.name,
    username: reply?.user.username,
    text: reply.message.trim() ?? "",
    date: reply?.createdAt ? new Date(reply.createdAt).toISOString() : "",
    likes: Number(reply?.likes ?? 0),
    userId: reply?.user?._id ? String(reply.user._id) : null,
  };
}

function formatReview(review) {
  const text =
    typeof review?.message === "string" && review.message.trim() ? review.message.trim() : "";

  return {
    _id: String(review?._id ?? ""),
    author: review?.user.name,
    username: review?.user.username,
    text,
    date: review?.createdAt ? new Date(review.createdAt).toISOString() : "",
    imageUrl: null,
    likes: Number(review?.likes ?? 0),
    userId: review?.user?._id ? String(review.user._id) : null,
    movieImdbId: review?.movieImdbId ?? "",
    movieTitle: review?.movieTitle ?? "",
    replies: Array.isArray(review?.replies) ? review.replies.map(formatReply) : [],
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
    const imdbId = req.query.imdbId.trim()

    const filter = imdbId
      ? { movieImdbId: { $regex: `^${escapeRegex(imdbId)}$`, $options: "i" } }
      : {};

    const reviews = await Review.find(filter)
      .populate("user", "name username")
      .populate("replies.user", "name username")
      .sort({ createdAt: -1 })
      .lean();

    return successRes(res, 200, "Reviews fetched successfully", {
      reviews: reviews.map(formatReview).filter((review) => review.text),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch reviews";
    return errorRes(res, 500, message);
  }
}

export async function saveReview(req, res) {
  try {
    const reviewId = req.params.reviewId.trim();
    const { message, movieImdbId, movieTitle } = req.body

    if (!message) {
      return errorRes(res, 400, "message is required");
    }

    if (reviewId) {
      const review = await Review.findById(reviewId.trim());
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
    const reviewId = req.params.reviewId.trim();

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
    const reviewId = req.params.reviewId.trim()
    if (!reviewId) {
      return errorRes(res, 400, "reviewId is required");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    review.likes++;
    await review.save();

    return successRes(res, 200, "Review liked successfully", {
      totalLikes: review.likes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to like review";
    return errorRes(res, 500, message);
  }
}

export async function addReply(req, res) {
  try {
    const reviewId = req.params.reviewId.trim()
    const { message } = req.body

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
    });
    await review.save();

    return successRes(res, 200, "Reply added successfully", {
      review,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reply to review";
    return errorRes(res, 500, message);
  }
}