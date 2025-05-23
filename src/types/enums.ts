export enum EResponseMessage {
  IS_REQUIRED = "requiredFields",
  PASSWORD_LENGTH = "passwordLength",
  EMAIL_TAKEN = "emailTaken",
  USERNAME_TAKEN = "usernameTaken",
  USER_REGISTERED = "userRegistered",
  USER_LOGIN = "userLogin",
  INVALID_CREDENTIALS = "invalidCredentials",
  PASS_MISS_MACH = "passMissMatch",
  USER_NOT_FOUND = "userNotFound",
  TOKEN_REQUIRED = "tokenRequired",
  INVALID_TOKEN = "invalidToken",
  TOKEN_REFRESHED = "tokenRefreshed",
  SERVER_ERROR = "serverError",
  SONGS_NOT_FIND = "songsNotFind",
  SONG_NOT_FIND = "songNotFind",
  SONG_ALREADY_LIKED = "songAlreadyLiked",
  SONG_NOT_LIKED = "songNotLiked",
  PLAYLIST_ALREADY_LIKED = "playlistAlreadyLiked",
  PLAYLIST_NOT_LIKED = "playlistNotLiked",
  PLAYLIST_NOT_FOUND = "playlistNotFound",
}

export enum EVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
}
