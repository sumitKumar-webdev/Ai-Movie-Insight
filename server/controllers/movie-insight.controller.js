import { summarizeWithOpenAI } from "../lib/openai.js";
import MovieInsight from "../models/MovieInsight.js";
import Review from "../models/Review.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatCommunityReview(review) {
  const author = review.user?.name?.trim() || review.user?.username?.trim() || "User";
  const message = typeof review?.message === "string" ? review.message.trim() : "";
  const userId = review?.user?._id ? String(review.user._id) : null;
  const username = review?.user?.username?.trim() || "";
  const likeCount = Number(review.likes ?? 0);

  return {
    _id: String(review._id),
    user: {
      id: userId,
      name: author,
      username,
      imageUrl: review?.user?.avatar?.trim() || null,
      isVerified: Boolean(review?.user?.is_verified),
    },
    author,
    text: message,
    date: review?.createdAt ? new Date(review.createdAt).toISOString() : "",
    likeCount,
    likedByUser: false,
    commentCount: review.replies.length,
    replies: review.replies.map((reply) => ({
      _id: String(reply?._id ?? ""),
      user: {
        id: reply?.user?._id ? String(reply.user._id) : null,
        name: reply.user?.name?.trim() || reply.user?.username?.trim() || "User",
        username: reply.user?.username?.trim() || "",
        imageUrl: reply?.user?.avatar?.trim() || null,
        isVerified: Boolean(reply?.user?.is_verified),
      },
      text: typeof reply?.message === "string" ? reply.message.trim() : "",
      date: reply?.createdAt ? new Date(reply.createdAt).toISOString() : "",
      likeCount: Number(reply?.likes ?? 0),
      likedByUser: false,
    })),
  };
}

async function loadInsightReviewContext(imdbId) {
  const normalizedImdbId = String(imdbId ?? "").trim().toLowerCase();
  const communityReviews = await Review.find({
    movieImdbId: { $regex: `^${escapeRegex(normalizedImdbId)}$`, $options: "i" },
  })
    .sort({ createdAt: -1 })
    .populate("user", "name username avatar is_verified")
    .populate("replies.user", "name username avatar is_verified")
    .select("movieImdbId movieTitle message likes createdAt user replies")
    .lean();

  const formattedReviews = communityReviews
    .map(formatCommunityReview)
    .filter((review) => review.text);
  const reviewTexts = communityReviews
    .map((review) => (typeof review?.message === "string" ? review.message.trim() : ""))
    .filter(Boolean);
  const fallbackTitle =
    communityReviews.find(
      (review) => typeof review?.movieTitle === "string" && review.movieTitle.trim(),
    )?.movieTitle?.trim()
    || `Movie ${normalizedImdbId}`;

  return {
    imdbId: normalizedImdbId,
    communityReviews: formattedReviews,
    reviewTexts,
    reviewCount: reviewTexts.length,
    fallbackTitle,
  };
}

function shouldRefreshSavedInsight(savedInsight, reviewCount, forceRefresh) {
  if (forceRefresh || !savedInsight) {
    return true;
  }

  const savedReviewCount = Number(savedInsight.reviewCount ?? 0);

  if (savedReviewCount < 2 && reviewCount >= 2) {
    return true;
  }

  if (reviewCount >= savedReviewCount + 3) {
    return true;
  }

  if (reviewCount < savedReviewCount) {
    return true;
  }

  return false;
}

function mapSavedInsight(savedInsight, options) {
  const normalizedConfidence = Number(savedInsight?.confidencePercentage ?? 0);
  const confidencePercentage = !Number.isFinite(normalizedConfidence)
    ? 0
    : normalizedConfidence > 1
      ? Math.max(0, Math.min(100, Math.round(normalizedConfidence)))
      : Math.max(0, Math.min(100, Math.round(normalizedConfidence * 100)));

  return {
    imdbId: options.imdbId,
    title:
      (typeof savedInsight?.movieTitle === "string" ? savedInsight.movieTitle.trim() : "")
      || options.title,
    summary:
      (typeof savedInsight?.summary === "string" ? savedInsight.summary.trim() : "")
      || "No community reviews yet. Be the first to share what you thought about this movie.",
    sentiment: savedInsight.sentiment || "NoReviews",
    confidence: confidencePercentage / 100,
    communityReviews: options.communityReviews,
  };
}

async function buildFreshInsight(context, preferredTitle) {
  const title = preferredTitle.trim() || context.fallbackTitle;

  const insight = {
    imdbId: context.imdbId,
    title,
    summary: "At least two community reviews are needed before CineAI can generate an insight.",
    sentiment: "NoReviews",
    confidence: 0,
    communityReviews: context.communityReviews,
    canPersist: true,
  };

  if (context.reviewCount < 2) return insight;

  const joinedReviews = context.reviewTexts
    .slice(0, 10)
    .map((text, index) => `Review ${index + 1}: ${text}`)
    .join("\n\n");

  try {
    const ai = await summarizeWithOpenAI(title, joinedReviews, "reviews");
    if (ai?.summary) {
      insight.summary = ai.summary;
      insight.confidence = Number(ai.confidence ?? 0);
      insight.sentiment = ai.sentiment ?? "Mixed";
      return insight;
    }
  } catch {
    insight.canPersist = false;
  }

  insight.summary = "CineAI could not refresh the latest summary right now.";
  insight.sentiment = "Mixed";
  insight.confidence = 0;
  return insight;
}

async function persistInsight(insight, reviewCount) {
  const normalizedConfidence = Number(insight.confidence ?? 0);
  const confidencePercentage = !Number.isFinite(normalizedConfidence)
    ? 0
    : normalizedConfidence > 1
      ? Math.max(0, Math.min(100, Math.round(normalizedConfidence)))
      : Math.max(0, Math.min(100, Math.round(normalizedConfidence * 100)));

  await MovieInsight.findOneAndUpdate(
    { imdbId: insight.imdbId },
    {
      imdbId: insight.imdbId,
      movieTitle: insight.title,
      summary: insight.summary,
      sentiment: insight.sentiment,
      confidencePercentage,
      reviewCount,
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return {
    ...insight,
    confidence: confidencePercentage / 100,
  };
}

export async function getStoredMovieAiInsight(imdbId, title = "", options = {}) {
  const context = await loadInsightReviewContext(imdbId);
  const preferredTitle = title.trim() || context.fallbackTitle;
  const savedInsight = await MovieInsight.findOne({ imdbId: context.imdbId }).lean();
  const forceRefresh = options.forceRefresh === true;

  if (!shouldRefreshSavedInsight(savedInsight, context.reviewCount, forceRefresh)) {
    return mapSavedInsight(savedInsight, {
      imdbId: context.imdbId,
      title: preferredTitle,
      communityReviews: context.communityReviews,
    });
  }

  const freshInsight = await buildFreshInsight(context, preferredTitle);

  if (!freshInsight.canPersist && savedInsight) {
    return mapSavedInsight(savedInsight, {
      imdbId: context.imdbId,
      title: preferredTitle,
      communityReviews: context.communityReviews,
    });
  }

  return persistInsight(freshInsight, context.reviewCount);
}
