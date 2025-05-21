import {
  getRandomSongsByAuthors,
  getRecommendedPlaylistsBySongsAuthors,
  getRecommendedPlaylistsBySongsGenres,
  getRecommendedSongsByAuthors,
  getRecommendedSongsByGenres,
} from "@/controllers/recommendation.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

router.get(
  "/playlists/genres",
  authMiddleware,
  getRecommendedPlaylistsBySongsGenres
);
router.get(
  "/playlists/authors",
  authMiddleware,
  getRecommendedPlaylistsBySongsAuthors
);
router.get("/songs/genres", authMiddleware, getRecommendedSongsByGenres);
router.get("/songs/authors", authMiddleware, getRecommendedSongsByAuthors);
router.get("/songs/random", authMiddleware, getRandomSongsByAuthors);

export default router;
