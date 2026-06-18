import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const make = async (password: string): Promise<string> => bcrypt.hash(password, SALT_ROUNDS);

export const check = async (password: string, hashed: string): Promise<boolean> => bcrypt.compare(password, hashed);
