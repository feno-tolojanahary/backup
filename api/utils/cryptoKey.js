const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

const getSecret = () => {
  const secret = process.env.DESTINATION_KEY_SECRET;
  if (!secret) {
    throw new Error(
      "DESTINATION_KEY_SECRET is required to encrypt destination private keys."
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
};

const encryptText = (plainText) => {
  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    alg: ALGORITHM,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
};

const decryptText = (payload) => {
  if (!payload?.data || !payload?.iv || !payload?.tag) {
    throw new Error("Invalid encrypted payload.");
  }
  const key = getSecret();
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const encrypted = Buffer.from(payload.data, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
};

module.exports = {
  encryptText,
  decryptText,
};
