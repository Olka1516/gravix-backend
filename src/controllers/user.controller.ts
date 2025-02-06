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
    const { email, password } = req.body;

    const user = await UserEntity.findOne({ email });
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
        nickname: user.username,
        avatar: user.avatar,
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
