import {
  createSong,
  getRecomendedArtistsByGenres,
  getSongById,
  getSongsByUsername,
} from "@/controllers/song.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/create", authMiddleware, createSong);
router.get("/all/:username", authMiddleware, getSongsByUsername);
router.get("/:id", authMiddleware, getSongById);
router.get("/genres/artists", authMiddleware, getRecomendedArtistsByGenres);

export default router;
