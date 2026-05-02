"use client";

import { ReviewShareCardPayload } from "@/app/models/service.modal";

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

// Story canvas dimensions — card is inset and centered
const STORY_CANVAS_WIDTH  = 1080;
const STORY_CANVAS_HEIGHT = 1920;
const CARD_INSET_X = 52;
const CARD_INSET_Y = 96;
const CARD_W = STORY_CANVAS_WIDTH  - CARD_INSET_X * 2; // 976
const CARD_H = STORY_CANVAS_HEIGHT - CARD_INSET_Y * 2; // 1728
const CARD_RADIUS = 0; // sharp edges

const VERIFIED_BADGE_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
    <path fill="#3c82f6" d="M8.38 14.72h-.71L6 13H3.53L3 12.5v-2.42L1.31 8.36v-.71L3 5.93V3.5l.53-.5H6l1.67-1.71h.71L10.1 3h2.43l.5.49v2.44l1.71 1.72v.71L13 10.08v2.42l-.5.5h-2.4l-1.72 1.72Zm-1.65-4.24h.71l3.77-3.77L10.5 6L7.09 9.42L5.71 8.04L5 8.75l1.73 1.73Z"/>
  </svg>`,
)}`;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildReviewShareCardFileName(review: ReviewShareCardPayload | null) {
  const movie  = slugify(review?.content?.title || "cineai-review");
  const author = slugify(review?.user?.username || review?.user?.name || "user");
  return `${movie}-${author}-review.jpg`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to read image data"));
    };
    reader.onerror = () => reject(new Error("Unable to read image data"));
    reader.readAsDataURL(blob);
  });
}

async function inlineImageUrl(url?: string | null) {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) {
    return normalizedUrl || "";
  }

  try {
    const response = await fetch(normalizedUrl, { cache: "force-cache" });
    if (!response.ok) {
      return normalizedUrl;
    }
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return normalizedUrl;
  }
}

async function inlineShareCardAssets(review: ReviewShareCardPayload | null) {
  if (!review) {
    return review;
  }

  const [posterUrl, avatarUrl] = await Promise.all([
    inlineImageUrl(review.content?.posterUrl),
    inlineImageUrl(review.user?.imageUrl),
  ]);

  return {
    ...review,
    content: { ...review.content, posterUrl },
    user:    { ...review.user,    imageUrl: avatarUrl },
  };
}

function createRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

async function loadImage(url?: string | null) {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) {
    return null;
  }

  return await new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload  = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = normalizedUrl;
  });
}

function drawImageCoverTop(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
) {
  const sourceRatio = image.width / image.height;
  const destRatio   = dWidth / dHeight;

  let sx = 0;
  const sy = 0;
  let sWidth  = image.width;
  let sHeight = image.height;

  if (sourceRatio > destRatio) {
    sWidth = image.height * destRatio;
    sx     = (image.width - sWidth) / 2;
  } else {
    sHeight = image.width / destRatio;
  }

  context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}

let verifiedBadgeImagePromise: Promise<HTMLImageElement | null> | null = null;

function loadVerifiedBadgeImage() {
  if (!verifiedBadgeImagePromise) {
    verifiedBadgeImagePromise = loadImage(VERIFIED_BADGE_SVG_DATA_URL);
  }
  return verifiedBadgeImagePromise;
}

function normalizeReviewText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n+/g, "\n\n")
    .replace(/[ \t]+$/gm, "");
}

function fitTextToWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const paragraphs = text.split(/\r\n|\r|\n/);
  const lines: string[] = [];

  for (let pIndex = 0; pIndex < paragraphs.length && lines.length < maxLines; pIndex += 1) {
    const paragraph = paragraphs[pIndex];
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";

    if (words.length === 0) {
      if (lines.length < maxLines) {
        lines.push("");
      }
      continue;
    }

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (lines.length >= maxLines) break;
      current = word;
    }

    if (current && lines.length < maxLines) {
      lines.push(current);
    }
  }

  const allWords = text.split(/\s+/).filter(Boolean);
  const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumedWords < allWords.length && lines.length > 0) {
    let truncated = lines[lines.length - 1] ?? "";
    while (truncated && context.measureText(`${truncated}...`).width > maxWidth) {
      truncated = truncated.slice(0, -1).trimEnd();
    }
    lines[lines.length - 1] = truncated ? `${truncated}...` : "...";
  }

  return lines;
}

function drawMultilineText(
  context: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    maxLines: number;
    lineHeight: number;
    font: string;
    color: string;
  },
) {
  context.save();
  context.font      = options.font;
  context.fillStyle = options.color;
  const lines = fitTextToWidth(context, text, options.maxWidth, options.maxLines);
  lines.forEach((line, index) => {
    context.fillText(line, options.x, options.y + index * options.lineHeight);
  });
  context.restore();
}

async function renderPreparedReviewShareCardToJpegBlob(review: ReviewShareCardPayload) {
  const canvas = document.createElement("canvas");
  canvas.width  = STORY_CANVAS_WIDTH;
  canvas.height = STORY_CANVAS_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create image canvas");
  }

  const [poster, avatar, verifiedBadge] = await Promise.all([
    loadImage(review.content?.posterUrl),
    loadImage(review.user?.imageUrl),
    review.user?.isVerified ? loadVerifiedBadgeImage() : Promise.resolve(null),
  ]);

  // ── Story background (blurred poster or dark gradient) ──────────────────
  context.save();
  if (poster) {
    context.filter = "blur(32px) brightness(0.28) saturate(1.2)";
    drawImageCoverTop(context, poster, -40, -40, STORY_CANVAS_WIDTH + 80, STORY_CANVAS_HEIGHT + 80);
    context.filter = "none";
  } else {
    const storyBg = context.createLinearGradient(0, 0, 0, STORY_CANVAS_HEIGHT);
    storyBg.addColorStop(0, "#0b0e15");
    storyBg.addColorStop(1, "#07090e");
    context.fillStyle = storyBg;
    context.fillRect(0, 0, STORY_CANVAS_WIDTH, STORY_CANVAS_HEIGHT);
  }
  // dark scrim so card pops
  context.fillStyle = "rgba(4,6,10,0.55)";
  context.fillRect(0, 0, STORY_CANVAS_WIDTH, STORY_CANVAS_HEIGHT);
  context.restore();

  // ── Card shadow ──────────────────────────────────────────────────────────
  context.save();
  context.shadowColor   = "rgba(0,0,0,0.72)";
  context.shadowBlur    = 40;
  context.shadowOffsetY = 24;
  context.fillStyle     = "rgba(9,12,15,0.01)";
  createRoundedRectPath(context, CARD_INSET_X, CARD_INSET_Y, CARD_W, CARD_H, CARD_RADIUS);
  context.fill();
  context.restore();

  // ── Clip to card bounds ──────────────────────────────────────────────────
  context.save();
  createRoundedRectPath(context, CARD_INSET_X, CARD_INSET_Y, CARD_W, CARD_H, CARD_RADIUS);
  context.clip();

  // Card base
  const cardBg = context.createLinearGradient(0, CARD_INSET_Y, 0, CARD_INSET_Y + CARD_H);
  cardBg.addColorStop(0, "#090b10");
  cardBg.addColorStop(1, "#080a0f");
  context.fillStyle = cardBg;
  context.fillRect(CARD_INSET_X, CARD_INSET_Y, CARD_W, CARD_H);

  const ox = CARD_INSET_X;
  const oy = CARD_INSET_Y;

  // ── Poster ───────────────────────────────────────────────────────────────
  const posterHeight = Math.round(CARD_H * 0.50);
  if (poster) {
    context.save();
    context.filter = "brightness(0.82) saturate(1.06) contrast(1.02)";
    drawImageCoverTop(context, poster, ox, oy, CARD_W, posterHeight);
    context.restore();
  }

  const posterGradient = context.createLinearGradient(0, oy, 0, oy + posterHeight);
  posterGradient.addColorStop(0,    "rgba(6,8,11,0.04)");
  posterGradient.addColorStop(0.34, "rgba(6,8,11,0.12)");
  posterGradient.addColorStop(0.78, "rgba(6,8,11,0.72)");
  posterGradient.addColorStop(1,    "#090c0f");
  context.fillStyle = posterGradient;
  context.fillRect(ox, oy, CARD_W, posterHeight);

  const horizontalGradient = context.createLinearGradient(ox, 0, ox + CARD_W, 0);
  horizontalGradient.addColorStop(0,    "rgba(6,8,11,0.2)");
  horizontalGradient.addColorStop(0.18, "transparent");
  horizontalGradient.addColorStop(0.82, "transparent");
  horizontalGradient.addColorStop(1,    "rgba(6,8,11,0.26)");
  context.fillStyle = horizontalGradient;
  context.fillRect(ox, oy, CARD_W, posterHeight);

  // ── "CineAI Review" badge ────────────────────────────────────────────────
  const reviewBadgeX      = ox + 32;
  const reviewBadgeY      = oy + 32;
  const reviewBadgeWidth  = 250;
  const reviewBadgeHeight = 60;
  const reviewBadgeRadius = 30;
  const reviewDotX        = reviewBadgeX + 24;
  const reviewDotY        = reviewBadgeY + reviewBadgeHeight / 2;
  const reviewBadgeTextX  = reviewBadgeX + 42;
  const reviewBadgeTextY  = reviewBadgeY + 40;

  context.fillStyle = "rgba(9,12,15,0.78)";
  createRoundedRectPath(context, reviewBadgeX, reviewBadgeY, reviewBadgeWidth, reviewBadgeHeight, reviewBadgeRadius);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1;
  context.stroke();

  context.fillStyle = "#5ce0ff";
  context.beginPath();
  context.arc(reviewDotX, reviewDotY, 5, 0, Math.PI * 2);
  context.fill();

  context.font      = "600 28px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.52)";
  context.fillText("CineAI Review", reviewBadgeTextX, reviewBadgeTextY);

  // ── Type • Year ──────────────────────────────────────────────────────────
  const movieType = (review.content?.type?.trim() || "Movie").toUpperCase();
  const movieYear = (review.content?.year?.trim() || "Unknown").toUpperCase();
  const reviewText       = normalizeReviewText(review.text?.trim() || "");
  const reviewFont       = "400 38px sans-serif";
  const reviewLineHeight = 50;
  const reviewMaxWidth   = CARD_W - 96;
  const dividerToTextGap = 30;
  const maxFooterRuleY   = oy + CARD_H - 28;
  const footerTextOffset = 12;
  const footerPadding    = 28;

  const titleText = review.content?.title?.trim() || "Untitled";
  context.save();
  context.font = "700 90px serif";
  const titleLines = fitTextToWidth(context, titleText, 780, 3);
  context.restore();

  const titleHeight = (Math.max(titleLines.length, 1) - 1) * 80 + 18;
  const baseTitleTopY = oy + posterHeight - 56;
  const minTitleTopY = oy + 48;
  const titleBottomDefaultY = baseTitleTopY + titleHeight;
  const avatarGapFromTitle = 80;
  const dividerGapFromAvatar = 22;
  const titleToDivider = avatarGapFromTitle + 60 + dividerGapFromAvatar;
  const defaultDividerY = titleBottomDefaultY + titleToDivider;

  context.font = reviewFont;
  const provisionalLines  = fitTextToWidth(context, reviewText, reviewMaxWidth, 200);
  const reviewTextHeight  = Math.max(provisionalLines.length, 1) * reviewLineHeight;
  const minReviewAreaHeight = reviewLineHeight * 6;
  const effectiveReviewTextHeight = Math.max(reviewTextHeight, minReviewAreaHeight);

  const desiredDividerY = maxFooterRuleY - effectiveReviewTextHeight - footerPadding - dividerToTextGap;
  const minDividerY = defaultDividerY - (baseTitleTopY - minTitleTopY);
  const dividerY = Math.max(minDividerY, desiredDividerY);

  const titleTopY = baseTitleTopY + (dividerY - defaultDividerY);
  const typeYearY = titleTopY - 72;
  const reviewTextY = dividerY + dividerToTextGap;
  const footerRuleY = Math.min(reviewTextY + effectiveReviewTextHeight + footerPadding, maxFooterRuleY);
  const footerTextY = footerRuleY + footerTextOffset;

  context.font      = "600 26px sans-serif";
  context.fillStyle = "rgba(92,224,255,0.56)";
  context.fillText(`${movieType} • ${movieYear}`, ox + 48, typeYearY);

  // ── Title ────────────────────────────────────────────────────────────────
  drawMultilineText(context, titleText, {
    x:          ox + 48,
    y:          titleTopY,
    maxWidth:   780,
    maxLines:   3,
    lineHeight: 80,
    font:       "700 80px serif",
    color:      "#ffffff",
  });

  // ── Avatar ───────────────────────────────────────────────────────────────
  const avatarSize = 104;
  const avatarX    = ox + 48;
  const avatarY    = dividerY - (avatarSize + dividerGapFromAvatar);

  if (avatar) {
    context.save();
    createRoundedRectPath(context, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
    context.clip();
    context.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    context.restore();
  } else {
    const avatarGradient = context.createLinearGradient(
      avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize,
    );
    avatarGradient.addColorStop(0, "#10263d");
    avatarGradient.addColorStop(1, "#0b1724");
    context.fillStyle = avatarGradient;
    createRoundedRectPath(context, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
    context.fill();
  }

  context.strokeStyle = "rgba(92,224,255,0.16)";
  context.lineWidth   = 2;
  createRoundedRectPath(context, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
  context.stroke();

  if (!avatar) {
    const initials = (review.user?.name || review.user?.username || "CR")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

    context.font          = "700 32px sans-serif";
    context.fillStyle     = "rgba(92,224,255,0.82)";
    context.textAlign     = "center";
    context.textBaseline  = "middle";
    context.fillText(initials || "CR", avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 2);
    context.textAlign    = "start";
    context.textBaseline = "alphabetic";
  }

  // ── Name + meta ──────────────────────────────────────────────────────────
  const nameX    = avatarX + avatarSize + 22;
  const nameY    = avatarY + 42;
  const userName = review.user?.name?.trim() || "Anonymous";

  context.font      = "700 38px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.fillText(userName, nameX, nameY);

  if (review.user?.isVerified && verifiedBadge) {
    const nameWidth  = context.measureText(userName).width;
    const badgeSize  = 32;
    context.drawImage(verifiedBadge, nameX + nameWidth + 12, nameY - 24, badgeSize, badgeSize);
  }

  context.font      = "500 34px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.38)";
  const reviewDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "Today";
  const userMeta = `@${review.user?.username?.trim() || "cineai_user"} • ${reviewDate}`;
  context.fillText(userMeta, nameX, avatarY + 84);

  // ── Divider ──────────────────────────────────────────────────────────────
  context.fillStyle = "rgba(255,255,255,0.065)";
  context.fillRect(ox + 48, dividerY, CARD_W - 96, 2);

  // ── Review text ──────────────────────────────────────────────────────────
  const availableLines = Math.max(
    1,
    Math.floor((footerRuleY - reviewTextY - 24) / reviewLineHeight),
  );
  drawMultilineText(context, reviewText, {
    x:          ox + 48,
    y:          reviewTextY,
    maxWidth:   reviewMaxWidth,
    maxLines:   availableLines,
    lineHeight: reviewLineHeight,
    font:       reviewFont,
    color:      "rgba(255,255,255,0.78)",
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  context.fillStyle = "rgba(255,255,255,0.06)";
  context.fillRect(ox + 48, footerRuleY, CARD_W - 96, 2);

  context.font      = "600 30px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.18)";
  context.textAlign = "center";
  context.fillText("CineAI", ox + CARD_W / 2, footerTextY);
  context.textAlign = "start";

  context.restore(); // end card clip

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to export share card"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.95,
    );
  });
}

export async function renderReviewShareCardToJpegBlob(review: ReviewShareCardPayload) {
  const exportReview = await inlineShareCardAssets(review);
  if (!exportReview) {
    throw new Error("Unable to prepare share card");
  }
  return renderPreparedReviewShareCardToJpegBlob(exportReview);
}

export async function renderReviewShareCardToObjectUrl(review: ReviewShareCardPayload) {
  const blob = await renderReviewShareCardToJpegBlob(review);
  return URL.createObjectURL(blob);
}