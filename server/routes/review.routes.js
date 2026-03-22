import { Router } from "express";
import {
  addReply,
  deleteReply,
  deleteReview,
  likeReply,
  likeReview,
  listReplies,
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
router.get("/:reviewId/replies", listReplies);
router.post("/:reviewId/replies", requireAuth, addReply);
router.post("/:reviewId/replies/:replyId/likes", requireAuth, likeReply);
router.delete("/:reviewId/replies/:replyId", requireAuth, deleteReply);

export default router;
