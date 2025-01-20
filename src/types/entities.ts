export interface IUser {
  nickname: string;
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

export interface ITokenUserData extends Pick<IUser, "nickname" | "id"> {}
