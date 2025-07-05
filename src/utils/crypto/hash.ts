import bcrypt from "bcrypt";
import { createHash } from "crypto";
import dotenv from "dotenv";

dotenv.config();

export const hashPassword = async (password: string) => {
  const SALT_ROUNDS: number = parseInt(process.env.SALT || "10");
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const comparePasswords = async (
  password: string,
  hashedPassword: string
) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error: any) {
    throw new Error(error);
  }
};

/**
 * bcrypted hash is non-deterministic wich means it always returns a different value
 * we however can use on password and just use bcrypt.compare()
 */
export const hashEmail = (email: string) => {
  return createHash("sha256").update(email.trim()).digest("hex");
};
