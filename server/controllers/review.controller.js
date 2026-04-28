import { errorRes, successRes } from "../lib/res.js";
import { getAccessToken, verifyAccessToken } from "../lib/auth.js";
import { fetchImdbTitleById } from "../lib/movie.js";
import { getStoredMovieAiInsight } from "./movie-insight.controller.js";
import Review from "../models/Review.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveUserId(user) {
  return user?._id ? String(user._id) : user ? String(user) : null;
}

function resolveCurrentUserId(req) {
  if (req?.auth?.userId) return String(req.auth.userId);

  const token = getAccessToken(req);
  const payload = token ? verifyAccessToken(token) : null;
  return payload?.userId ? String(payload.userId) : null;
}

function getMovieMetaFromTitle(title) {
  return {
    posterUrl: title?.primaryImage?.url?.trim() || "",
    movieYear: title?.startYear ? String(title.startYear) : "",
    movieType: title?.type?.trim() || "",
  };
}

async function buildReviewMovieMetaMap(reviews) {
  const imdbIds = Array.from(
    new Set(
      (Array.isArray(reviews) ? reviews : [])
        .map((review) => String(review?.movieImdbId ?? "").trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const entries = await Promise.all(
    imdbIds.map(async (imdbId) => {
      const title = await fetchImdbTitleById(imdbId).catch(() => null);
      return [imdbId, getMovieMetaFromTitle(title)];
    }),
  );

  return new Map(entries);
}


function formatReply(reply, options = {}) {
  const reviewId = String(options.reviewId ?? "");
  const reviewUsername = options.reviewUsername?.trim() || "";
  const currentUserId = options.currentUserId ? String(options.currentUserId) : null;
  const replyToType = reply?.replyToType === "reply" ? "reply" : "review";
  const replyToId =
    replyToType === "reply" && reply?.replyToReplyId
      ? String(reply.replyToReplyId)
      : reviewId;
  const userId = resolveUserId(reply?.user);
  const userName = reply?.user?.name?.trim() || reply?.user?.username?.trim() || "User";
  const username = reply?.user?.username?.trim() || "";
  const likeCount = Number(reply?.likes ?? 0);
  const likedByUser = Array.isArray(reply?.likedBy)
    && currentUserId
    && reply.likedBy.some((likedUserId) => String(likedUserId) === currentUserId);

  return {
    _id: String(reply?._id ?? ""),
    user: {
      id: userId,
      name: userName,
      username,
      imageUrl: reply?.user?.avatar?.trim() || null,
      isVerified: Boolean(reply?.user?.is_verified),
    },
    text: typeof reply?.message === "string" ? reply.message.trim() : "",
    date: reply?.createdAt ? new Date(reply.createdAt).toISOString() : "",
    likeCount,
    likedByUser: Boolean(likedByUser),
    replyToType,
    replyToId,
    replyToUsername: reply?.replyToUsername?.trim() || reviewUsername,
  };
}

function formatReview(review, options = {}) {
  const includeReplies = options.includeReplies === true;
  const currentUserId = options.currentUserId ? String(options.currentUserId) : null;
  const movieMeta = options.movieMeta ?? {};
  const replies = Array.isArray(review?.replies) ? review.replies : [];
  const userId = resolveUserId(review?.user);
  const userName = review.user?.name?.trim() || review.user?.username?.trim() || "User";
  const username = review?.user?.username?.trim() || "";
  const likeCount = Number(review?.likes ?? 0);
  const commentCount = replies.length;
  const likedByUser = Array.isArray(review?.likedBy)
    && currentUserId
    && review.likedBy.some((likedUserId) => String(likedUserId) === currentUserId);

  return {
    _id: String(review?._id ?? ""),
    user: {
      id: userId,
      name: userName,
      username,
      imageUrl: review?.user?.avatar?.trim() || null,
      isVerified: Boolean(review?.user?.is_verified),
    },
    text: typeof review?.message === "string" ? review.message.trim() : "",
    date: review?.createdAt ? new Date(review.createdAt).toISOString() : "",
    likeCount,
    likedByUser: Boolean(likedByUser),
    commentCount,
    movie: {
      imdbId: review?.movieImdbId ?? "",
      title: review?.movieTitle ?? "",
    },
    posterUrl: movieMeta.posterUrl || undefined,
    movieYear: movieMeta.movieYear || undefined,
    movieType: movieMeta.movieType || undefined,
    replies: includeReplies
      ? replies.map((reply) =>
        formatReply(reply, {
          reviewId: review?._id,
          reviewUsername: review?.user?.username,
          currentUserId,
        }))
      : [],
  };
}

async function findFormattedReviewById(reviewId, currentUserId = null) {
  const review = await Review.findById(reviewId)
    .populate("user", "name username email avatar is_verified")
    .populate("replies.user", "name username email avatar is_verified")
    .lean();

  return review ? formatReview(review, { currentUserId }) : null;
}

function formatReviewShareCard(review, movie, options = {}) {
  const currentUserId = options.currentUserId ? String(options.currentUserId) : null;
  const likedByUser = Array.isArray(review?.likedBy)
    && currentUserId
    && review.likedBy.some((likedUserId) => String(likedUserId) === currentUserId);

  return {
    id: String(review?._id ?? ""),
    user: {
      id: resolveUserId(review?.user),
      username: review?.user?.username?.trim() || "",
      name: review?.user?.name?.trim() || "User",
      imageUrl: review?.user?.avatar?.trim() || null,
      isVerified: Boolean(review?.user?.is_verified),
    },
    content: {
      imdbId: review?.movieImdbId ?? "",
      title: movie?.primaryTitle?.trim() || review?.movieTitle?.trim() || "Untitled",
      posterUrl: movie?.primaryImage?.url?.trim() || "",
      year: movie?.startYear ? String(movie.startYear) : "",
      type: movie?.type?.trim() || "movie",
      backdropUrl: "",
    },
    text: typeof review?.message === "string" ? review.message.trim() : "",
    likeCount: Number(review?.likes ?? 0),
    commentCount: Array.isArray(review?.replies) ? review.replies.length : 0,
    likedByUser: Boolean(likedByUser),
    createdAt: review?.createdAt ? new Date(review.createdAt).toISOString() : "",
  };
}

export const listReviews = async (req, res) => {
  try {
    const currentUserId = resolveCurrentUserId(req);
    const imdbId = typeof req.query.imdbId === "string" ? req.query.imdbId.trim() : "";
    const userId = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
    const parsedLimit = Number.parseInt(String(req.query.limit ?? "").trim(), 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 50)
      : 0;
    const filter = {};

    if (imdbId) {
      filter.movieImdbId = { $regex: `^${escapeRegex(imdbId)}$`, $options: "i" };
    }

    if (userId) {
      filter.user = userId;
    }

    let reviewsQuery = Review.find(filter)
      .populate("user", "name username avatar is_verified")
      .sort({ createdAt: -1 })
      .lean();

    if (limit > 0) {
      reviewsQuery = reviewsQuery.limit(limit);
    }

    const reviews = await reviewsQuery;
    const movieMetaMap = await buildReviewMovieMetaMap(reviews);

    return successRes(res, 200, "Reviews fetched successfully", {
      reviews: reviews
        .map((review) =>
          formatReview(review, {
            currentUserId,
            movieMeta: movieMetaMap.get(String(review?.movieImdbId ?? "").trim().toLowerCase()),
          }))
        .filter((review) => review.text),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch reviews";
    return errorRes(res, 500, message);
  }
}

export const getReviewShareCard = async (req, res) => {
  try {
    const currentUserId = resolveCurrentUserId(req);
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";

    if (!reviewId) {
      return errorRes(res, 400, "reviewId is required");
    }

    const review = await Review.findById(reviewId)
      .populate("user", "name username avatar is_verified")
      .lean();

    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    const movie = review.movieImdbId
      ? await fetchImdbTitleById(review.movieImdbId).catch(() => null)
      : null;

    return successRes(res, 200, "Review share card fetched successfully", {
      shareCard: formatReviewShareCard(review, movie, { currentUserId }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch review share card";
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

      await getStoredMovieAiInsight(review.movieImdbId, review.movieTitle).catch((error) => {
        console.error("[review:sync-insight:update]", error);
      });

      const formattedReview = await findFormattedReviewById(review._id, req.auth.userId);

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

    await getStoredMovieAiInsight(movieImdbId, movieTitle).catch((error) => {
      console.error("[review:sync-insight:create]", error);
    });

    const formattedReview = await findFormattedReviewById(review._id, req.auth.userId);

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

    const deletedMovieImdbId = review.movieImdbId;
    const deletedMovieTitle = review.movieTitle;
    await review.deleteOne();

    await getStoredMovieAiInsight(deletedMovieImdbId, deletedMovieTitle).catch((error) => {
      console.error("[review:sync-insight:delete]", error);
    });

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
      likedByUser: !hasLiked,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to like review";
    return errorRes(res, 500, message);
  }
}

// replies

export async function saveReply(req, res) {
  try {
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";
    const replyId = typeof req.params?.replyId === "string" ? req.params.replyId.trim() : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const replyToReplyId =
      typeof req.body?.replyToReplyId === "string" ? req.body.replyToReplyId.trim() : "";

    if (!reviewId) {
      return errorRes(res, 400, "reviewId is required");
    }

    if (!message) {
      return errorRes(res, 400, "message is required");
    }

    const review = await Review.findById(reviewId)
      .populate("user", "name username avatar is_verified")
      .populate("replies.user", "name username avatar is_verified");
    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    if (!replyId) {
      const replyTarget = replyToReplyId ? review.replies.id(replyToReplyId) : null;

      review.replies.push({
        user: req.auth.userId,
        message,
        replyToType: replyTarget ? "reply" : "review",
        replyToReplyId: replyTarget?._id ?? null,
        replyToUsername:
          replyTarget?.user?.username?.trim()
          || review.user?.username?.trim()
          || review.user?.name?.trim()
          || "",
        likes: 0,
        likedBy: [],
      });
      await review.save();

      const populatedReview = await Review.findById(reviewId)
        .populate("replies.user", "name username avatar is_verified")
        .lean();
      const latestReply = populatedReview?.replies?.[populatedReview.replies.length - 1];

      return successRes(res, 200, "Reply added successfully", {
        reply: latestReply
          ? formatReply(latestReply, { currentUserId: req.auth.userId })
          : null,
      });
    }

    const reply = review.replies.id(replyId);
    if (!reply) {
      return errorRes(res, 404, "Reply not found");
    }

    if (resolveUserId(reply.user) !== String(req.auth.userId)) {
      return errorRes(res, 403, "You can only edit your own reply");
    }

    reply.message = message;
    await review.save();

    const populatedReview = await Review.findById(reviewId)
      .populate("replies.user", "name username avatar is_verified")
      .lean();
    const updatedReply = populatedReview?.replies?.find(
      (item) => String(item?._id ?? "") === replyId,
    );

    return successRes(res, 200, "Reply updated successfully", {
      reply: updatedReply
        ? formatReply(updatedReply, { currentUserId: req.auth.userId })
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update reply";
    return errorRes(res, 500, message);
  }
}

export async function listReplies(req, res) {
  try {
    const currentUserId = resolveCurrentUserId(req);
    const reviewId = typeof req.params?.reviewId === "string" ? req.params.reviewId.trim() : "";

    if (!reviewId) {
      return errorRes(res, 400, "reviewId is required");
    }

    const review = await Review.findById(reviewId)
      .populate("user", "name username avatar is_verified")
      .populate("replies.user", "name username avatar is_verified")
      .lean();

    if (!review) {
      return errorRes(res, 404, "Review not found");
    }

    return successRes(res, 200, "Replies fetched successfully", {
      review: formatReview(review, { includeReplies: false, currentUserId }),
      replies: Array.isArray(review.replies)
        ? review.replies.map((reply) =>
          formatReply(reply, {
            reviewId,
            reviewUsername: review?.user?.username,
            currentUserId,
          }))
        : [],
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
      likedByUser: !hasLiked,
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
