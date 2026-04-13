const crypto = require("node:crypto");

const PRIVATE_KEY_PATTERNS = [
    /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]+-----END OPENSSH PRIVATE KEY-----/,
    /-----BEGIN RSA PRIVATE KEY-----[\s\S]+-----END RSA PRIVATE KEY-----/,
    /-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----/,
    /-----BEGIN DSA PRIVATE KEY-----[\s\S]+-----END DSA PRIVATE KEY-----/,
    /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/
];

const normalizePrivateKey = (privateKey) => {
    if (typeof privateKey !== "string") {
        throw new Error("Private key must be a string.");
    }

    const normalized = privateKey.replace(/\r\n/g, "\n").trim();
    if (!normalized) {
        throw new Error("Private key is required.");
    }

    return `${normalized}\n`;
};

const isSupportedPrivateKeyFormat = (privateKey) =>
    PRIVATE_KEY_PATTERNS.some((pattern) => pattern.test(privateKey));

const validatePrivateKey = (privateKey, passphrase) => {
    const normalized = normalizePrivateKey(privateKey);

    if (!isSupportedPrivateKeyFormat(normalized)) {
        throw new Error("Private key must be a valid OpenSSH or PEM private key.");
    }

    try {
        crypto.createPrivateKey({
            key: normalized,
            format: "pem",
            passphrase: passphrase || undefined,
        });
    } catch (error) {
        throw new Error("Private key could not be parsed. Check the key format and passphrase.");
    }

    return normalized;
};

const getPrivateKeyFingerprint = (privateKey, passphrase) => {
    const normalized = validatePrivateKey(privateKey, passphrase);
    const privateKeyObject = crypto.createPrivateKey({
        key: normalized,
        format: "pem",
        passphrase: passphrase || undefined,
    });
    const publicKeyDer = crypto
        .createPublicKey(privateKeyObject)
        .export({ type: "spki", format: "der" });
    const hash = crypto.createHash("sha256").update(publicKeyDer).digest("base64");

    return `SHA256:${hash.replace(/=+$/, "")}`;
};

module.exports = {
    getPrivateKeyFingerprint,
    normalizePrivateKey,
    validatePrivateKey,
};
