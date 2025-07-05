import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const ENCRYPTION_KEY: string = process.env.ENCRYPTION_KEY as string;
const ALGORITHM: string = process.env.ALGORITHM as string;
const IV: string = process.env.IV as string;

export const encryptData = (data: string): string => {
  const cypher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    Buffer.from(IV, "utf8")
  );
  let encrypted = cypher.update(data, "utf8", "hex");
  encrypted += cypher.final("hex");

  return encrypted;
};

export const decryptData = (key: string, data: string): string => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    Buffer.from(IV, "utf8")
  );
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
