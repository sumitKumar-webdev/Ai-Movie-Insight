"use client";

import { ReviewShareCardPayload } from "@/app/modal/service.modal";

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

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
  const movie = slugify(review?.content?.title || "cineai-review");
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
    content: {
      ...review.content,
      posterUrl,
    },
    user: {
      ...review.user,
      imageUrl: avatarUrl,
    },
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
    image.onload = () => resolve(image);
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
  const destRatio = dWidth / dHeight;

  let sx = 0;
  const sy = 0;
  let sWidth = image.width;
  let sHeight = image.height;

  if (sourceRatio > destRatio) {
    sWidth = image.height * destRatio;
    sx = (image.width - sWidth) / 2;
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

function fitTextToWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumedWords < words.length && lines.length > 0) {
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
  context.font = options.font;
  context.fillStyle = options.color;
  const lines = fitTextToWidth(context, text, options.maxWidth, options.maxLines);
  lines.forEach((line, index) => {
    context.fillText(line, options.x, options.y + index * options.lineHeight);
  });
  context.restore();
}

async function renderPreparedReviewShareCardToJpegBlob(review: ReviewShareCardPayload) {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create image canvas");
  }

  const [poster, avatar, verifiedBadge] = await Promise.all([
    loadImage(review.content?.posterUrl),
    loadImage(review.user?.imageUrl),
    review.user?.isVerified ? loadVerifiedBadgeImage() : Promise.resolve(null),
  ]);

  const reviewText = (review.text?.trim() || "").slice(0, 1050);
  const posterHeight = Math.round(SHARE_CARD_HEIGHT * 0.55);
  const reviewFont = "400 38px sans-serif";
  const reviewLineHeight = 46;
  const reviewMaxWidth = SHARE_CARD_WIDTH - 96;
  const dividerToTextGap = 34;
  const minFooterRuleY = 1652;
  const maxFooterRuleY = 1840;
  const footerTextOffset = 48;

  context.fillStyle = "#06080b";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();

  const backgroundGradient = context.createLinearGradient(0, 0, 0, SHARE_CARD_HEIGHT);
  backgroundGradient.addColorStop(0, "#090b10");
  backgroundGradient.addColorStop(1, "#080a0f");
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  if (poster) {
    context.save();
    context.filter = "brightness(0.82) saturate(1.06) contrast(1.02)";
    drawImageCoverTop(context, poster, 0, 0, SHARE_CARD_WIDTH, posterHeight);
    context.restore();
  }

  const posterGradient = context.createLinearGradient(0, 0, 0, posterHeight);
  posterGradient.addColorStop(0, "rgba(6,8,11,0.04)");
  posterGradient.addColorStop(0.34, "rgba(6,8,11,0.12)");
  posterGradient.addColorStop(0.78, "rgba(6,8,11,0.72)");
  posterGradient.addColorStop(1, "#090c0f");
  context.fillStyle = posterGradient;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, posterHeight);

  const horizontalGradient = context.createLinearGradient(0, 0, SHARE_CARD_WIDTH, 0);
  horizontalGradient.addColorStop(0, "rgba(6,8,11,0.2)");
  horizontalGradient.addColorStop(0.18, "transparent");
  horizontalGradient.addColorStop(0.82, "transparent");
  horizontalGradient.addColorStop(1, "rgba(6,8,11,0.26)");
  context.fillStyle = horizontalGradient;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, posterHeight);

  const reviewBadgeX = 32;
  const reviewBadgeY = 32;
  const reviewBadgeWidth = 250;
  const reviewBadgeHeight = 60;
  const reviewBadgeRadius = 30;
  const reviewDotX = reviewBadgeX + 24;
  const reviewDotY = reviewBadgeY + reviewBadgeHeight / 2;
  const reviewBadgeTextX = reviewBadgeX + 42;
  const reviewBadgeTextY = reviewBadgeY + 40;

  context.fillStyle = "rgba(9,12,15,0.78)";
  createRoundedRectPath(
    context,
    reviewBadgeX,
    reviewBadgeY,
    reviewBadgeWidth,
    reviewBadgeHeight,
    reviewBadgeRadius,
  );
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1;
  context.stroke();

  context.fillStyle = "#5ce0ff";
  context.beginPath();
  context.arc(reviewDotX, reviewDotY, 5, 0, Math.PI * 2);
  context.fill();

  context.font = "600 28px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.52)";
  context.fillText("CineAI Review", reviewBadgeTextX, reviewBadgeTextY);

  const movieType = (review.content?.type?.trim() || "Movie").toUpperCase();
  const movieYear = (review.content?.year?.trim() || "Unknown").toUpperCase();
  context.font = "600 28px sans-serif";
  context.fillStyle = "rgba(92,224,255,0.56)";
  context.fillText(`${movieType} • ${movieYear}`, 48, 888);

  drawMultilineText(context, review.content?.title?.trim() || "Untitled", {
    x: 48,
    y: 975,
    maxWidth: 780,
    maxLines: 3,
    lineHeight: 98,
    font: "700 96px serif",
    color: "#ffffff",
  });

  const titleText = review.content?.title?.trim() || "Untitled";
  context.save();
  context.font = "700 96px serif";
  const titleLines = fitTextToWidth(context, titleText, 780, 3);
  context.restore();
  const titleBottomY = 942 + (Math.max(titleLines.length, 1) - 1) * 94 + 18;
  const avatarGapFromTitle = 70;
  const dividerGapFromAvatar = 18;
  const baseDividerY = titleBottomY + avatarGapFromTitle + 88 + dividerGapFromAvatar;

  context.font = reviewFont;
  const provisionalLines = fitTextToWidth(context, reviewText, reviewMaxWidth, 40);
  const reviewTextHeight = Math.max(provisionalLines.length, 1) * reviewLineHeight;
  const baseAvailableHeight = maxFooterRuleY - (baseDividerY + dividerToTextGap) - 40;
  const overlayShift = Math.min(
    Math.max(reviewTextHeight - baseAvailableHeight, 0),
    320,
  );
  const dividerY = baseDividerY - overlayShift;
  const reviewTextY = dividerY + dividerToTextGap;
  const footerRuleY = Math.min(
    Math.max(reviewTextY + reviewTextHeight + 88, minFooterRuleY),
    maxFooterRuleY,
  );
  const footerTextY = footerRuleY + footerTextOffset;

  const avatarSize = 104;
  const avatarX = 48;
  const avatarY = dividerY - (avatarSize + dividerGapFromAvatar);
  if (avatar) {
    context.save();
    createRoundedRectPath(context, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
    context.clip();
    context.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    context.restore();
  } else {
    const avatarGradient = context.createLinearGradient(
      avatarX,
      avatarY,
      avatarX + avatarSize,
      avatarY + avatarSize,
    );
    avatarGradient.addColorStop(0, "#10263d");
    avatarGradient.addColorStop(1, "#0b1724");
    context.fillStyle = avatarGradient;
    createRoundedRectPath(context, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
    context.fill();
  }

  context.strokeStyle = "rgba(92,224,255,0.16)";
  context.lineWidth = 2;
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

    context.font = "700 32px sans-serif";
    context.fillStyle = "rgba(92,224,255,0.82)";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(initials || "CR", avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 2);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
  }

  const nameX = avatarX + avatarSize + 18;
  const nameY = avatarY + 39;
  const userName = review.user?.name?.trim() || "Anonymous";

  context.font = "700 38px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.fillText(userName, nameX, nameY);

  if (review.user?.isVerified && verifiedBadge) {
    const nameWidth = context.measureText(userName).width;
    const badgeSize = 32;
    context.drawImage(verifiedBadge, nameX + nameWidth + 12, nameY - 24, badgeSize, badgeSize);
  }

  context.font = "500 34px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.38)";
  const reviewDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";
  const userMeta = `@${review.user?.username?.trim() || "cineai_user"} • ${reviewDate}`;
  context.fillText(userMeta, nameX, avatarY + 78);

  context.fillStyle = "rgba(255,255,255,0.065)";
  context.fillRect(48, dividerY, SHARE_CARD_WIDTH - 96, 2);

  const availableLines = Math.max(
    1,
    Math.floor((footerRuleY - reviewTextY - 40) / reviewLineHeight),
  );
  drawMultilineText(context, reviewText, {
    x: 48,
    y: reviewTextY,
    maxWidth: reviewMaxWidth,
    maxLines: availableLines,
    lineHeight: reviewLineHeight,
    font: reviewFont,
    color: "rgba(255,255,255,0.78)",
  });

  context.fillStyle = "rgba(255,255,255,0.06)";
  context.fillRect(48, footerRuleY, SHARE_CARD_WIDTH - 96, 2);

  context.font = "600 30px sans-serif";
  context.fillStyle = "rgba(255,255,255,0.18)";
  context.textAlign = "center";
  context.fillText("CineAI", SHARE_CARD_WIDTH / 2, footerTextY);
  context.restore();

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
