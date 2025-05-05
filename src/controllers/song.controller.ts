import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import Song from "@/entities/Song.entity";
import { UploadedFile } from "express-fileupload";
import { EResponseMessage } from "@/types/enums";
import UserEntity from "@/entities/User.entity";

type CloudinaryUploadResponse = {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
};

export const createSong = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      username,
      title,
      description,
      lyrics,
      genres,
      author,
      duration,
      releaseYear,
      rating,
      ratingCount,
    } = req.body;

    if (
      !req.files?.song ||
      !username ||
      !title ||
      !author ||
      !genres ||
      !duration ||
      !releaseYear
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Завантажуємо пісню у Cloudinary
    let songFile = req.files.song as UploadedFile;
    const songUpload = await new Promise((resolve) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "video" }, (error, uploadResult) => {
          return resolve(uploadResult);
        })
        .end(songFile.data);
    });

    // Якщо є обкладинка - завантажуємо
    let imageFile = req.files.image as UploadedFile;

    const imageUpload = await new Promise((resolve) => {
      cloudinary.uploader
        .upload_stream((error, uploadResult) => {
          return resolve(uploadResult);
        })
        .end(imageFile.data);
    });

    const imageUrl = imageUpload as CloudinaryUploadResponse;
    const songUrl = songUpload as CloudinaryUploadResponse;

    // Збереження в MongoDB
    const newSong = new Song({
      username,
      title,
      description,
      lyrics,
      image: imageUrl.secure_url,
      song: songUrl.secure_url,
      genres: JSON.parse(genres),
      author,
      duration,
      releaseYear,
      rating: rating ? Number(rating) : 0,
      ratingCount: ratingCount ? Number(ratingCount) : 0,
    });

    await newSong.save();

    res.status(201).json({
      message: "Song uploaded successfully",
      song: newSong,
    });
  } catch (error) {
    next(error);
  }
};

export const getSongsByUsername = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;

    const songs = await Song.find({ username });
    if (!songs) {
      res.status(404).json({ message: EResponseMessage.SONGS_NOT_FIND });
      return;
    }

    const formattedSongs = songs.map((song) => ({
      username: song.username,
      author: song.author,
      description: song.description,
      duration: song.duration,
      genres: song.genres,
      image: song.image,
      lyrics: song.lyrics,
      rating: song.rating,
      ratingCount: song.ratingCount,
      releaseYear: song.releaseYear,
      song: song.song,
      title: song.title,
      id: song.id,
    }));

    res.status(200).json(formattedSongs);
  } catch (error) {
    next(error);
  }
};

export const getSongById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const song = await Song.findOne({ _id: id });
    if (!song) {
      res.status(404).json({ message: EResponseMessage.SONG_NOT_FIND });
      return;
    }

    const formattedSong = {
      username: song.username,
      author: song.author,
      description: song.description,
      duration: song.duration,
      genres: song.genres,
      image: song.image,
      lyrics: song.lyrics,
      rating: song.rating,
      ratingCount: song.ratingCount,
      releaseYear: song.releaseYear,
      song: song.song,
      title: song.title,
      id: song.id,
    };

    res.status(200).json(formattedSong);
  } catch (error) {
    next(error);
  }
};

export const getRecomendedArtistsByGenres = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.username) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const genresParam = req.query.genres;

    if (!genresParam || typeof genresParam !== "string") {
      res.status(400).json({ message: "Genres are required" });
      return;
    }

    const genres = genresParam.split(",").map((genre) => genre.trim());

    const allUsers: {
      username: string;
      avatar: string | null;
      songsInGenre: number;
      genre: string;
      id: string;
    }[] = [];

    for (const genre of genres) {
      const songs = await Song.find({ genres: genre });

      const userSongCounts: Record<string, number> = {};
      songs.forEach((song) => {
        const username = song.username;
        userSongCounts[username] = (userSongCounts[username] || 0) + 1;
      });

      const users = await Promise.all(
        Object.keys(userSongCounts).map(async (username) => {
          const user = await UserEntity.findOne({ username });
          if (!user) return null;

          return {
            username,
            avatar: user.avatar,
            songsInGenre: userSongCounts[username],
            genre,
            id: user.id,
          };
        })
      );

      const genreUsers = users
        .filter(Boolean)
        .sort((a, b) => b!.songsInGenre - a!.songsInGenre);

      allUsers.push(...(genreUsers as any[]));
    }

    // Ensure at least one user per genre
    const selectedUsers: {
      username: string;
      avatar: string | null;
      genre: string;
      id: string;
    }[] = [];

    const usedUsernames = new Set<string>();

    for (const genre of genres) {
      const userInGenre = allUsers.find(
        (u) => u.genre === genre && !usedUsernames.has(u.username)
      );
      if (userInGenre) {
        selectedUsers.push(userInGenre);
        usedUsernames.add(userInGenre.username);
      }
    }

    // Fill up to 10 users total
    const remainingUsers = allUsers
      .filter((u) => !usedUsernames.has(u.username))
      .sort((a, b) => b.songsInGenre - a.songsInGenre);

    for (const user of remainingUsers) {
      if (selectedUsers.length >= 10) break;
      selectedUsers.push(user);
      usedUsernames.add(user.username);
    }

    const response = selectedUsers.map((user) => ({
      image: user.avatar,
      text: user.username,
      id: user.id,
    }));

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
