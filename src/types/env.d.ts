declare namespace NodeJS {
  export interface ProcessEnv {
    MONGO_URL: string;
    JWT_REFRESH_SECRET: string;
    JWT_SECRET: string;
    REFRESH_TOKEN_EXPIRATION: string;
    ACCESS_TOKEN_EXPIRATION: string;
    PORT?: string;
  }
}
