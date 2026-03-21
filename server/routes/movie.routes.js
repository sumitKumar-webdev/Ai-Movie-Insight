import { Router } from "express";
import {
  chatMovieAssistant,
  getMovieByImdbId,
  searchMovies,
} from "../controllers/movie.controller.js";

const router = Router();

router.get("/search", searchMovies);
router.post("/assistant", chatMovieAssistant);
router.get("/:imdbId", getMovieByImdbId);

export default router;
