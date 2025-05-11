import {
  createSong,
  deleteSongById,
  getSongById,
  getSongsByAuthor,
  patchDislike,
  patchLike,
  updateSong,
} from "@/controllers/song.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/create", authMiddleware, createSong);
router.get("/all/:author", authMiddleware, getSongsByAuthor);
router.get("/:id", authMiddleware, getSongById);
router.delete("/:id", authMiddleware, deleteSongById);
router.patch("/like/:id", authMiddleware, patchLike);
router.patch("/dislike/:id", authMiddleware, patchDislike);
router.put("/update/:id", authMiddleware, updateSong);

export default router;
