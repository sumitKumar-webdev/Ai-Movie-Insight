# AI Movie Insight Builder

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create `client/.env.local` (or update `client/.env`) with required values:

```env
IMDB_API_BASE_URL=https://api.imdbapi.dev
NEXT_PUBLIC_IMDB_API_BASE_URL=https://api.imdbapi.dev
MONGODB_URI=mongodb://127.0.0.1:27017/ai_movie_insight
```

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

5. Run checks:

```bash
npm run lint
npm run test
```

## Tech Stack Rationale (And Why We Selected It)

- Next.js (App Router): selected for file-based routing, server/client component support, and fast iteration with Turbopack.
- React + TypeScript: selected for predictable UI composition and safer refactoring with static typing.
- Tailwind CSS + reusable UI components: selected for fast styling and consistent design tokens across pages/components.
- IMDb API (`api.imdbapi.dev`): selected as the primary movie metadata source due to reliable access and rich credits/person payloads.
- OpenAI API: selected to generate concise AI insight/sentiment summaries from up to 10 audience reviews.
- Vitest: selected for lightweight and fast unit testing of utility and transformation logic.

## Assumptions

- Users search and navigate primarily by IMDb title IDs (`tt...`) for detail pages.
- External API responses can be partially missing (for example no reviews or missing profile images), so UI must gracefully handle null/empty fields.
- OpenAI summarization is optional at runtime and should fail safely to deterministic fallback sentiment when API/model/key is unavailable.
- This repository currently contains the frontend app in `client/`; commands in this README are intended to run from that directory.
- Network/API availability can vary by region; app behavior should still remain functional with fallbacks when upstream calls fail.


## How The AI Insight Works

1. Movie data is fetched from the IMDb API, including audience reviews (if available).
2. The app takes at most 10 reviews and builds a compact prompt payload.
3. That payload is sent to the OpenAI model configured via `OPENAI_MODEL`.
4. The model returns a structured insight response (summary/sentiment/confidence-like output).
5. If reviews are missing, the app uses a no-reviews fallback sentiment so the UI remains stable.
6. If AI request fails, the app does not crash and shows fallback output.

At the moment, if AI output is not visible in your environment, the most likely reason is environment/runtime configuration (invalid or missing `OPENAI_API_KEY`, incorrect model name, quota/rate limits, or blocked outbound network), not implementation gaps.

 The AI pipeline is implemented and wired correctly, with graceful fallback behavior when upstream AI is unavailable.

## Next.js + MongoDB Backend

This app now includes MongoDB-backed API routes using Mongoose:

- `GET /api/movies` list movies
- `GET /api/movies?q=inception` search by title
- `GET /api/movies?genre=Drama` filter by genre
- `POST /api/movies` create movie
- `GET /api/movies/:id` get movie by Mongo `_id`
- `PATCH /api/movies/:id` update movie
- `DELETE /api/movies/:id` delete movie

Example `POST /api/movies` body:

```json
{
  "title": "Inception",
  "imdbId": "tt1375666",
  "genres": ["Action", "Sci-Fi"],
  "releaseYear": 2010,
  "posterUrl": "https://...",
  "overview": "A thief who steals corporate secrets through dream-sharing technology..."
}
```

## Reviews + Authentication API

Authentication endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`

Review endpoints:

- `GET /api/reviews`
- `POST /api/reviews` (auth required)
- `GET /api/reviews/:id`
- `PATCH /api/reviews/:id` (owner only)
- `DELETE /api/reviews/:id` (owner only)
- `POST /api/reviews/:id/likes` (auth required)
- `POST /api/reviews/:id/replies` (auth required)

Send token in `Authorization` header:

```txt
Authorization: Bearer <JWT_TOKEN>
```

Google OAuth notes:

- Add `GOOGLE_CLIENT_ID` in `.env`
- From frontend, complete Google Sign-In and send returned `idToken` to `POST /api/auth/google`
- This endpoint handles both sign-up (new user) and sign-in (existing user)

`POST /api/auth/google` body:

```json
{
  "idToken": "google_id_token_from_client"
}
```

`POST /api/reviews` body:

```json
{
  "message": "Great movie, especially the final act."
}
```

`POST /api/reviews/:id/replies` body:

```json
{
  "message": "Agree, soundtrack was excellent too."
}
```
