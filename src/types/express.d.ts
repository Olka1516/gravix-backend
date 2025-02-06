import { ITokenUserData } from "@/types/entities";
import { UploadedFile } from "express-fileupload";

declare global {
  namespace Express {
    interface Request {
      user?: ITokenUserData;
      files?: {
        song?: UploadedFile | UploadedFile[];
        image?: UploadedFile | UploadedFile[];
      };
    }
  }
}
