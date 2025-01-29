type User = {
  username: string;
  role: string;
  isBanned: boolean;
};

declare global {
  declare module "express-serve-static-core" {
    interface Request {
      user?: User;
    }
  }
}
