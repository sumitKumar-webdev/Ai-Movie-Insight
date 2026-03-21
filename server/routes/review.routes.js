import { Router } from "express";
import {
  addReply,
  deleteReview,
  likeReview,
  listReviews,
  saveReview,
} from "../controllers/review.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listReviews);
router.post("/", requireAuth, saveReview);
router.patch("/:reviewId", requireAuth, saveReview);
router.delete("/:reviewId", requireAuth, deleteReview);
router.post("/:reviewId/likes", requireAuth, likeReview);
router.post("/:reviewId/replies", requireAuth, addReply);

export default router;
