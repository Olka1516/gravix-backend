export interface IUser {
  username: string;
  email: string;
  password: string;
  id: string;
  avatar: string | null;
  subscribers: string[];
  following: string[];
  preferences: string[];
}

export interface ITimeStamp {
  _ts: {
    ct: Date;
    ut: Date;
  };
}

export interface ITokenUserData extends Pick<IUser, "username" | "id"> {}
