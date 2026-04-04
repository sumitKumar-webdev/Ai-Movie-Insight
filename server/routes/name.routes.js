import { Router } from "express";
import { getNameById, getNameFilmography } from "../controllers/name.controller.js";

const router = Router();

router.get("/:nameId/filmography", getNameFilmography);
router.get("/:nameId", getNameById);

export default router;
