import { Router } from "express";
import {
  chatMovieAssistant,
  getMovieAiInsight,
  getMovieByImdbId,
  getMovieGenresByImdbId,
  getPersonalMovieSelection,
  listTitles,
  searchMovies,
} from "../controllers/movie.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/search", searchMovies);
router.get("/titles", listTitles);
router.post("/assistant", requireAuth, chatMovieAssistant);
router.post("/personal-selection", requireAuth, getPersonalMovieSelection);
router.get("/:imdbId/insight", getMovieAiInsight);
router.get("/:imdbId/genres", getMovieGenresByImdbId);
router.get("/:imdbId", getMovieByImdbId);

export default router;
