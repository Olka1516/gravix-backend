import Song from "@/entities/Song.entity";
import { EResponseMessage } from "@/types/enums";
import { NextFunction, Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import cloudinary from "../config/cloudinary";
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
      title,
      description,
      lyrics,
      genres,
      duration,
      releaseYear,
      rating,
    } = req.body;

    if (!req.user?.username) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const author = req.user?.username;
    const authorID = req.user?.id;

    if (
      !req.files?.song ||
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
      title,
      description,
      lyrics,
      image: imageUrl.secure_url,
      song: songUrl.secure_url,
      genres: JSON.parse(genres),
      author,
      authorID,
      duration,
      releaseYear,
      rating: rating ? Number(rating) : 0,
      likes: [],
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

export const updateSong = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const songId = req.params.id;

    if (!req.user?.username) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const existingSong = await Song.findById(songId);
    if (!existingSong) {
      res.status(404).json({ message: "Song not found" });
      return;
    }

    const {
      title,
      description,
      lyrics,
      genres,
      duration,
      releaseYear,
      rating,
    } = req.body;

    // Оновлюємо текстові поля, якщо вони надійшли
    if (title) existingSong.title = title;
    if (description) existingSong.description = description;
    if (lyrics) existingSong.lyrics = lyrics;
    if (duration) existingSong.duration = duration;
    if (releaseYear) existingSong.releaseYear = releaseYear;
    if (rating !== undefined) existingSong.rating = Number(rating);
    if (genres) {
      existingSong.genres = Array.isArray(genres) ? genres : JSON.parse(genres);
    }

    // Якщо є новий аудіофайл
    if (req.files?.song) {
      const songFile = req.files.song as UploadedFile;
      const songUpload = await new Promise((resolve) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "video" }, (error, uploadResult) => {
            resolve(uploadResult);
          })
          .end(songFile.data);
      });
      const songUrl = songUpload as CloudinaryUploadResponse;
      existingSong.song = songUrl.secure_url;
    }

    // Якщо є нове зображення
    if (req.files?.image) {
      const imageFile = req.files.image as UploadedFile;
      const imageUpload = await new Promise((resolve) => {
        cloudinary.uploader
          .upload_stream((error, uploadResult) => {
            resolve(uploadResult);
          })
          .end(imageFile.data);
      });
      const imageUrl = imageUpload as CloudinaryUploadResponse;
      existingSong.image = imageUrl.secure_url;
    }

    await existingSong.save();

    res.status(200).json({
      message: "Song updated successfully",
      song: existingSong,
    });
  } catch (error) {
    next(error);
  }
};

export const getSongsByAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { author } = req.params;

    const songs = await Song.find({ author });
    if (!songs) {
      res.status(404).json({ message: EResponseMessage.SONGS_NOT_FIND });
      return;
    }

    const formattedSongs = songs.map((song) => ({
      author: song.author,
      authorID: song.authorID,
      description: song.description,
      duration: song.duration,
      genres: song.genres,
      image: song.image,
      lyrics: song.lyrics,
      rating: song.rating,
      likes: song.likes,
      releaseYear: song.releaseYear,
      song: song.song,
      title: song.title,
      _id: song._id,
    }));

    res.status(200).json(formattedSongs);
  } catch (error) {
    next(error);
  }
};

export const getRecommendedArtistsByGenres = async (
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
        const username = song.author;
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

export const getSongById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const song = await Song.findById(id);

    if (!song) {
      res.status(404).json({ message: EResponseMessage.SONG_NOT_FIND });
      return;
    }

    const formattedSong = {
      author: song.author,
      authorID: song.authorID,
      description: song.description,
      duration: song.duration,
      genres: song.genres,
      image: song.image,
      lyrics: song.lyrics,
      rating: song.rating,
      likes: song.likes,
      releaseYear: song.releaseYear,
      song: song.song,
      title: song.title,
      _id: song._id,
    };

    res.status(200).json(formattedSong);
  } catch (error) {
    next(error);
  }
};

export const deleteSongById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const song = await Song.findById(id);
    if (!song) {
      res.status(404).json({ message: "Song not found" });
      return;
    }

    await song.deleteOne();

    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const patchLike = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const { id } = req.params;

    const song = await Song.findById(id);

    if (!song) {
      res.status(404).json({ message: EResponseMessage.SONG_NOT_FIND });
      return;
    }

    if (song.likes.includes(userId)) {
      res.status(400).json({ message: EResponseMessage.SONG_ALREADY_LIKED });
      return;
    }

    // 1. Лайкнути пісню
    const updatedSong = await Song.findByIdAndUpdate(
      id,
      { $addToSet: { likes: userId } },
      { new: true }
    );

    // 2. Додати всі жанри пісні до вподобань користувача (навіть з повторами)
    await UserEntity.updateOne(
      { id: userId },
      { $push: { preferences: { $each: song.genres } } }
    );

    res.status(200).json(updatedSong);
  } catch (error) {
    next(error);
  }
};

export const patchDislike = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const { id } = req.params;

    const song = await Song.findById(id);
    if (!song) {
      res.status(404).json({ message: EResponseMessage.SONG_NOT_FIND });
      return;
    }

    if (!song.likes.includes(userId)) {
      res.status(400).json({ message: EResponseMessage.SONG_NOT_LIKED });
      return;
    }

    // 1. Видалити лайк
    const updatedSong = await Song.findByIdAndUpdate(
      id,
      { $pull: { likes: userId } },
      { new: true }
    );

    // 2. Видалити по одному входженню кожного жанру з preferences
    const user = await UserEntity.findOne({ id: userId });

    if (user) {
      const updatedPreferences = [...user.preferences];

      for (const genre of song.genres) {
        const index = updatedPreferences.indexOf(genre);
        if (index !== -1) {
          updatedPreferences.splice(index, 1); // Видалити перше входження
        }
      }

      user.preferences = updatedPreferences;
      await user.save();
    }

    res.status(200).json(updatedSong);
  } catch (error) {
    next(error);
  }
};
