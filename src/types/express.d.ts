import { ITokenUserData } from "@/types/entities";

declare global {
  namespace Express {
    interface Request {
      user?: ITokenUserData;
    }
  }
}
