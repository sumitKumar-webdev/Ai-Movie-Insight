"use client";

import { ReviewShareCardPayload } from "@/app/modal/service.modal";

export const SHARE_CARD_WIDTH = 540;
export const SHARE_CARD_HEIGHT = 960;

export const shareCardStyles = `
  .share-card-root, .share-card-root *, .share-card-root *::before, .share-card-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .share-card-root {
    background: #05070a;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    font-family: 'DM Sans', system-ui, sans-serif;
    padding: 0;
    margin: 0;
    width: ${SHARE_CARD_WIDTH}px;
  }
  .share-card-root .card {
    width: ${SHARE_CARD_WIDTH}px;
    min-height: ${SHARE_CARD_HEIGHT}px;
    background: linear-gradient(180deg, #090b10 0%, #080a0f 100%);
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.07);
    overflow: hidden;
    position: relative;
    box-shadow: 0 30px 90px rgba(0,0,0,0.56);
  }
  .share-card-root .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(92,224,255,0.5) 40%, rgba(92,224,255,0.18) 70%, transparent 100%);
    z-index: 2;
  }
  .share-card-root .poster-block { position: relative; width: 100%; overflow: hidden; }
  .share-card-root .poster-img {
    width: 100%;
    height: 640px;
    object-fit: cover;
    object-position: center top;
    display: block;
    filter: brightness(0.82) saturate(1.06) contrast(1.02);
  }
  .share-card-root .poster-grain {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    background-size: 160px 160px;
    opacity: 0.35;
    pointer-events: none;
  }
  .share-card-root .poster-shadow {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(6,8,11,0.04) 0%, rgba(6,8,11,0.12) 34%, rgba(6,8,11,0.72) 78%, #090c0f 100%),
      linear-gradient(90deg, rgba(6,8,11,0.2) 0%, transparent 18%, transparent 82%, rgba(6,8,11,0.26) 100%);
  }
  .share-card-root .poster-label {
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(9,12,15,0.72);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 4px 10px 4px 7px;
    z-index: 1;
    backdrop-filter: blur(10px);
  }
  .share-card-root .poster-label-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #5ce0ff;
  }
  .share-card-root .poster-label-text {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
  }
  .share-card-root .poster-title-area {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 136px 24px 20px;
    background: linear-gradient(to bottom, transparent 0%, rgba(9,12,15,0.12) 18%, rgba(9,12,15,0.8) 54%, #090c0f 100%);
    z-index: 1;
  }
  .share-card-root .movie-meta {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(92,224,255,0.56);
    margin-bottom: 12px;
  }
  .share-card-root .movie-title {
    max-width: 360px;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 40px;
    font-weight: 600;
    color: #fff;
    line-height: 1.02;
    letter-spacing: -0.035em;
    text-shadow: 0 8px 28px rgba(0,0,0,0.7);
  }
  .share-card-root .body { padding: 18px 24px 0; }
  .share-card-root .user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .share-card-root .user-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10263d, #0b1724);
    border: 1px solid rgba(92,224,255,0.16);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 12px;
    font-weight: 500;
    color: rgba(92,224,255,0.82);
    flex-shrink: 0;
  }
  .share-card-root .user-name {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.88);
  }
  .share-card-root .user-handle {
    font-size: 11px;
    color: rgba(255,255,255,0.38);
    margin-top: 2px;
  }
  .share-card-root .div {
    height: 1px;
    background: rgba(255,255,255,0.065);
    margin-bottom: 16px;
  }
  .share-card-root .review-text {
    min-height: 190px;
    font-size: 17px;
    line-height: 1.86;
    color: rgba(255,255,255,0.78);
    font-weight: 400;
    letter-spacing: -0.01em;
  }
  .share-card-root .review-text em {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    color: #ffffff;
  }
  .share-card-root .brand-strip {
    margin-top: 18px;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 14px 0 16px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.18);
  }
`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) {
    return "CR";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatReviewDate(date: string) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatReviewText(text: string) {
  const escaped = escapeHtml(text);
  return escaped.replace(/&quot;([^&]+)&quot;/g, "<em>$1</em>");
}

function getReviewShareCardData(review: ReviewShareCardPayload | null) {
  const reviewText = review?.text?.trim() || "";

  return {
    movieTitle: review?.content?.title?.trim() || "Untitled",
    movieYear: review?.content?.year?.trim() || "Unknown",
    movieType: review?.content?.type?.trim() || "Movie",
    posterUrl: review?.content?.posterUrl?.trim() || "",
    userName: review?.user?.name?.trim() || "Anonymous",
    userHandle: review?.user?.username?.trim() || "cineai_user",
    reviewDate: formatReviewDate(review?.createdAt || "") || "Today",
    reviewTextHtml: formatReviewText(reviewText),
    avatarInitials: getInitials(review?.user?.name?.trim() || review?.user?.username?.trim() || "CR"),
  };
}

export function buildReviewShareCardHtml(review: ReviewShareCardPayload | null) {
  const data = getReviewShareCardData(review);

  return `<style>${shareCardStyles}</style>
  <div class="share-card-root">
    <div class="card">
    <div class="poster-block">
      ${data.posterUrl ? `<img class="poster-img" src="${escapeHtml(data.posterUrl)}" alt="Movie poster" />` : ""}
      <div class="poster-grain"></div>
      <div class="poster-shadow"></div>
      <div class="poster-label">
        <div class="poster-label-dot"></div>
        <span class="poster-label-text">CineAI Review</span>
      </div>
      <div class="poster-title-area">
        <p class="movie-meta">${escapeHtml(data.movieType)}  &middot;  ${escapeHtml(data.movieYear)}</p>
        <h1 class="movie-title">${escapeHtml(data.movieTitle)}</h1>
      </div>
    </div>
    <div class="body">
      <div class="user-row">
        <div class="user-avatar">${escapeHtml(data.avatarInitials)}</div>
        <div>
          <p class="user-name">${escapeHtml(data.userName)}</p>
          <p class="user-handle">@${escapeHtml(data.userHandle)}  &middot;  ${escapeHtml(data.reviewDate)}</p>
        </div>
      </div>
      <div class="div"></div>
      <div class="review-text">${data.reviewTextHtml}</div>
      <div class="brand-strip">CineAI</div>
    </div>
  </div>
  </div>`;
}

export default function ReviewShareCard({ review }: { review: ReviewShareCardPayload | null }) {
  const data = getReviewShareCardData(review);

  return (
    <div
      className="share-card-root"
      style={{ width: SHARE_CARD_WIDTH, background: "#06080b", fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{shareCardStyles}</style>
      <div className="card">
        <div className="poster-block">
          {data.posterUrl ? (
            <img className="poster-img" src={data.posterUrl} alt="Movie poster" />
          ) : null}
          <div className="poster-grain"></div>
          <div className="poster-shadow"></div>
          <div className="poster-label">
            <div className="poster-label-dot"></div>
            <span className="poster-label-text">CineAI Review</span>
          </div>
          <div className="poster-title-area">
            <p className="movie-meta">
              {data.movieType}  &middot;  {data.movieYear}
            </p>
            <h1 className="movie-title">{data.movieTitle}</h1>
          </div>
        </div>

        <div className="body">
          <div className="user-row">
            <div className="user-avatar">{data.avatarInitials}</div>
            <div>
              <p className="user-name">{data.userName}</p>
              <p className="user-handle">
                @{data.userHandle}  &middot;  {data.reviewDate}
              </p>
            </div>
          </div>
          <div className="div"></div>
          <div
            className="review-text"
            dangerouslySetInnerHTML={{ __html: data.reviewTextHtml }}
          />
          <div className="brand-strip">CineAI</div>
        </div>
      </div>
    </div>
  );
}

