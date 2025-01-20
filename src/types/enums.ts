export enum EResponseMessage {
  IS_REQUIRED = "requiredFields",
  PASSWORD_LENGTH = "passwordLength",
  EMAIL_TAKEN = "emailTaken",
  NICKNAME_TAKEN = "nicknameTaken",
  USER_REGISTERED = "userRegistered",
  USER_LOGIN = "userLogin",
  INVALID_CREDENTIALS = "invalidCredentials",
  PASS_MISS_MACH = "passMissMatch",
  USER_NOT_FOUND = "userNotFound",
  TOKEN_REQUIRED = "tokenRequired",
  INVALID_TOKEN = "invalidToken",
  TOKEN_REFRESHED = "tokenRefreshed",
  SERVER_ERROR = "serverError",
}

export enum EOperationNotificationType {
  NEW_DUEL = "new_duel",
  RESPOND_DUEL = "respond_duel",
  STORED_DUELS = "stored_duels",
}

export enum EStatusNotification {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

export enum EGameRequestMessageType {
  WAIT_PARTNER = "waitPartner",
  PARTNER_LEFT = "partnerLeft",
  GAME_START = "gameStart",
  PREPARATION = "preparation",
}

export enum EGameResponseMessageType {
  UPDATE_CARDS = "updateCards",
}
