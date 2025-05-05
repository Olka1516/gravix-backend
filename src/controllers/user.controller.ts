import { generateAccessToken, generateRefreshToken } from "@/config/jwt";
import UserEntity from "@/entities/User.entity";
import { EResponseMessage } from "@/types/enums";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      res.status(400).json({ message: EResponseMessage.IS_REQUIRED });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: EResponseMessage.PASSWORD_LENGTH });
      return;
    }

    const existingUsername = await UserEntity.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ message: EResponseMessage.USERNAME_TAKEN });
      return;
    }

    const existingEmail = await UserEntity.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: EResponseMessage.EMAIL_TAKEN });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserEntity.create({
      email,
      password: hashedPassword,
      username,
      id: uuidv4(),
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.status(201).json({
      message: EResponseMessage.USER_REGISTERED,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        avatar: newUser.avatar,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await UserEntity.findOne({ username });
    if (!user) {
      res.status(400).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: EResponseMessage.PASS_MISS_MACH });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      message: EResponseMessage.USER_LOGIN,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(404).json({ message: EResponseMessage.USER_NOT_FOUND });
      return;
    }

    const user = await UserEntity.findOne({ username: req.user.username });
    if (!user) {
      res.status(404).json({ message: EResponseMessage.USER_NOT_FOUND });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByUsername = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await UserEntity.findOne({ username });
    if (!user) {
      res.status(404).json({ message: EResponseMessage.USER_NOT_FOUND });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        subscribers: user.subscribers,
        following: user.following,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.username) {
      res.status(401).json({ message: EResponseMessage.INVALID_CREDENTIALS });
      return;
    }

    const { username } = req.user;

    const users = await UserEntity.find({ username: { $ne: username } });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    }));

    res.status(200).json({ players: formattedUsers });
  } catch (error) {
    next(error);
  }
};

export const saveUserAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, genres, artists } = req.body;

    if (!username) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = await UserEntity.findOne({ username });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Додаємо жанри в preferences
    user.preferences = Array.from(
      new Set([...(user.preferences || []), ...genres])
    );

    // Додаємо artists у following
    user.following = Array.from(
      new Set([...(user.following || []), ...artists])
    );

    await user.save();

    // Для кожного artist додаємо цього user до їх subscribers
    await Promise.all(
      artists.map(async (artistId: string) => {
        const artist = await UserEntity.findOne({ id: artistId });
        if (artist) {
          artist.subscribers = Array.from(
            new Set([...(artist.subscribers || []), user.id])
          );
          await artist.save();
        }
      })
    );

    res.status(200).json({ message: "User answers saved successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateSubscribers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, followee } = req.body;

    const user = await UserEntity.findOne({ username }); // the one initiating follow/unfollow
    const target = await UserEntity.findOne({ username: followee }); // the one being followed/unfollowed

    if (!user || !target) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isFollowing = user.following.includes(target.id);

    if (isFollowing) {
      // Unfollow
      user.following = user.following.filter((id) => id !== target.id);
      target.subscribers = target.subscribers.filter((id) => id !== user.id);
    } else {
      // Follow
      user.following.push(target.id);
      target.subscribers.push(user.id);
    }

    await user.save();
    await target.save();

    res.status(200).json({
      message: isFollowing
        ? "Successfully unfollowed"
        : "Successfully followed",
    });
  } catch (error) {
    next(error);
  }
};
