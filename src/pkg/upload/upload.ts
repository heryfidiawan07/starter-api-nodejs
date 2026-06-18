import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export const savePhoto = (
  buffer: Buffer,
  mimetype: string,
  originalname: string,
  storagePath: string,
): string => {
  if (!ALLOWED_TYPES.has(mimetype)) {
    throw new Error('file type not allowed, use jpeg, png, or webp');
  }
  if (buffer.length > MAX_SIZE) {
    throw new Error('file size exceeds 2MB limit');
  }

  fs.mkdirSync(storagePath, { recursive: true });

  const ext = path.extname(originalname);
  const filename = `${uuidv4()}_${Date.now()}${ext}`;
  const dest = path.join(storagePath, filename);

  fs.writeFileSync(dest, buffer);
  return filename;
};

export const deletePhoto = (storagePath: string, filename: string): void => {
  if (!filename) return;
  const filePath = path.join(storagePath, path.basename(filename));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const buildPhotoUrl = (storageUrl: string, filename: string): string => {
  if (!filename) return '';
  return `${storageUrl.replace(/\/$/, '')}/${filename}`;
};
