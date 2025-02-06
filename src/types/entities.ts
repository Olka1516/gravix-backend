export interface IUser {
  username: string;
  email: string;
  password: string;
  id: string;
  avatar: string | null;
}

export interface ITimeStamp {
  _ts: {
    ct: Date;
    ut: Date;
  };
}

export interface ITokenUserData extends Pick<IUser, "username" | "id"> {}
