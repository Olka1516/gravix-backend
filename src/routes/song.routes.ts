import {
  createSong,
  getSongById,
  getSongsByAuthor,
  patchDislike,
  patchLike,
} from "@/controllers/song.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/create", authMiddleware, createSong);
router.get("/all/:author", authMiddleware, getSongsByAuthor);
router.get("/:id", authMiddleware, getSongById);
router.patch("/like/:id", authMiddleware, patchLike);
router.patch("/dislike/:id", authMiddleware, patchDislike);

export default router;
