import "dotenv/config";
import fs from "fs";
import path from "path";

export const uploadsDirectory = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, "../../uploads");

export function ensureUploadDirectory(...segments: string[]): string {
  const directory = path.join(uploadsDirectory, ...segments);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}
