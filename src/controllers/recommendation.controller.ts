import PlayList from "@/entities/PlayList.entity";
import Song from "@/entities/Song.entity";
import UserEntity from "@/entities/User.entity";
import { EResponseMessage, EVisibility } from "@/types/enums";
import { NextFunction, Request, Response } from "express";

export const getRecommendedArtistsByGenres = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.username) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
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

export const getRecommendedPlaylistsBySongsGenres = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const user = await UserEntity.findOne({ id: req.user.id });
    const preferences = user?.preferences || [];

    const playlists = await PlayList.find({
      visibility: EVisibility.PUBLIC,
    }).populate("song");

    const filteredPlaylists = (playlists as any[]).filter((playlist) =>
      playlist.song.some((song: any) =>
        song.genres.some((genre: string) => preferences.includes(genre))
      )
    );

    res.status(200).json(filteredPlaylists);
  } catch (error) {
    next(error);
  }
};

export const getRecommendedPlaylistsBySongsAuthors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const user = await UserEntity.findOne({ id: req.user.id });
    const followingAuthors = user?.following || [];

    const playlists = await PlayList.find({
      visibility: EVisibility.PUBLIC,
    }).populate("song");

    const filteredPlaylists = playlists.filter((playlist) =>
      playlist.song.some((song: any) =>
        followingAuthors.includes(song.authorID)
      )
    );

    res.status(200).json(filteredPlaylists);
  } catch (error) {
    next(error);
  }
};

export const getRecommendedSongsByGenres = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const user = await UserEntity.findOne({ id: req.user.id });
    const preferences = user?.preferences || [];

    const songs = await Song.find({
      genres: { $in: preferences },
    });

    res.status(200).json(songs);
  } catch (error) {
    next(error);
  }
};

export const getRecommendedSongsByAuthors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const user = await UserEntity.findOne({ id: req.user.id });
    const following = user?.following || [];

    const songs = await Song.find({
      authorID: { $in: following },
    });

    res.status(200).json(songs);
  } catch (error) {
    next(error);
  }
};

export const getPopularSongs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const songs = await Song.aggregate([
      {
        $match: { authorID: { $ne: req.user.id } },
      },
      {
        $addFields: { likesCount: { $size: "$likes" } },
      },
      {
        $sort: { likesCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json(songs);
  } catch (error) {
    next(error);
  }
};

export const getPopularAuthors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const users = await UserEntity.aggregate([
      {
        $match: { id: { $ne: req.user.id } },
      },
      {
        $addFields: { subscribersCount: { $size: "$subscribers" } },
      },
      {
        $sort: { subscribersCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      subscribers: user.subscribers,
      following: user.following,
      preferences: user.preferences,
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    next(error);
  }
};

export const getPopularPlaylists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const playlists = await PlayList.aggregate([
      {
        $match: {
          ownerID: { $ne: req.user.id },
          visibility: EVisibility.PUBLIC,
        },
      },
      {
        $addFields: { likesCount: { $size: "$likes" } },
      },
      {
        $sort: { likesCount: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "songs",
          localField: "song",
          foreignField: "_id",
          as: "song",
        },
      },
    ]);

    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};

export const getRandomSongsByAuthors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const user = await UserEntity.findOne({ id: req.user.id });
    const following = user?.following || [];

    const songs = await Song.aggregate([
      { $match: { authorID: { $in: following } } },
      { $sample: { size: 32 } },
    ]);

    res.status(200).json(songs);
  } catch (error) {
    next(error);
  }
};

export const searchEntities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query, type } = req.query;

    if (
      !query ||
      typeof query !== "string" ||
      !type ||
      typeof type !== "string"
    ) {
      res.status(200).json([]);
      return;
    }

    const regex = new RegExp("^" + query, "i");
    let results: any[] = [];

    switch (type) {
      case "Artists":
        results = await UserEntity.find({ username: regex });
        break;
      case "Songs":
        results = await Song.find({ title: regex });
        break;
      case "Playlists":
        results = await PlayList.find({ name: regex }).populate("song");
        break;
      default:
        results = [];
    }
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};
