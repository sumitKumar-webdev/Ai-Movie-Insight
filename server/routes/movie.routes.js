import { Router } from "express";
import {
  chatMovieAssistant,
  getMovieAiInsight,
  getMovieByImdbId,
  searchMovies,
} from "../controllers/movie.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/search", searchMovies);
router.post("/assistant", requireAuth, chatMovieAssistant);
router.get("/:imdbId/insight", getMovieAiInsight);
router.get("/:imdbId", getMovieByImdbId);

export default router;
