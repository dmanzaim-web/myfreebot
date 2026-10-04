"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Secret master key for AES-256-GCM encryption
const SECRET_FILE = path.join(__dirname, "..", "data", ".secret_key");

function getMasterKey() {
  try {
    const dataDir = path.dirname(SECRET_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(SECRET_FILE)) {
      return fs.readFileSync(SECRET_FILE);
    }
    const newKey = crypto.randomBytes(32);
    fs.writeFileSync(SECRET_FILE, newKey, { mode: 0o600 });
    return newKey;
  } catch (err) {
    // Fallback in-memory key
    return crypto.createHash("sha256").update("mcfbot_internal_default_key").digest();
  }
}

const MASTER_KEY = getMasterKey();

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
function encryptSecret(plaintext) {
  if (!plaintext) return "";
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, iv);
    let encrypted = cipher.update(String(plaintext), "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err.message);
    return "";
  }
}

/**
 * Decrypt an AES-256-GCM encrypted string
 */
function decryptSecret(encryptedPayload) {
  if (!encryptedPayload || !encryptedPayload.includes(":")) return "";
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) return "";
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return "";
  }
}

/**
 * Generate a cryptographically secure Server Access Key
 * Format: mcf_sec_<48-char random hex>
 */
function generateAccessKey() {
  const random = crypto.randomBytes(24).toString("hex");
  return `mcf_sec_${random}`;
}

/**
 * SHA-256 hash of an Access Key for secure database storage & lookup
 */
function hashAccessKey(accessKey) {
  if (!accessKey) return "";
  return crypto.createHash("sha256").update(String(accessKey).trim()).digest("hex");
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function verifyAccessKey(providedKey, storedHash) {
  if (!providedKey || !storedHash) return false;
  const computedHash = hashAccessKey(providedKey);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Redact sensitive passwords and secrets from log strings or command outputs
 */
function redactSecrets(message, knownSecrets = []) {
  if (!message || typeof message !== "string") return message;
  let sanitized = message;

  // Mask common Minecraft login commands: /login <pass>, /register <pass> <pass>
  sanitized = sanitized.replace(
    /(\/(?:login|register|auth|changepassword))\s+([^\s]+)(?:\s+([^\s]+))?/gi,
    (match, cmd) => `${cmd} [REDACTED_PASSWORD]`
  );

  // Mask known secrets if provided
  for (const secret of knownSecrets) {
    if (secret && typeof secret === "string" && secret.length >= 3) {
      sanitized = sanitized.split(secret).join("[REDACTED]");
    }
  }

  // Mask access keys if they appear in logs
  sanitized = sanitized.replace(/mcf_sec_[a-f0-9]{48}/gi, "mcf_sec_[REDACTED]");

  return sanitized;
}

/**
 * In-memory sliding-window rate limiter for anonymous abuse protection
 */
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map();

    // Clean up expired entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, records] of this.hits.entries()) {
        const valid = records.filter((ts) => now - ts < this.windowMs);
        if (valid.length === 0) {
          this.hits.delete(key);
        } else {
          this.hits.set(key, valid);
        }
      }
    }, 60000).unref();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const records = this.hits.get(identifier) || [];
    const valid = records.filter((ts) => now - ts < this.windowMs);

    if (valid.length >= this.maxRequests) {
      return false;
    }

    valid.push(now);
    this.hits.set(identifier, valid);
    return true;
  }
}

module.exports = {
  encryptSecret,
  decryptSecret,
  generateAccessKey,
  hashAccessKey,
  verifyAccessKey,
  redactSecrets,
  RateLimiter
};
