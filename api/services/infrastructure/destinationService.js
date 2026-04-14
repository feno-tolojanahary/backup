const db = require("../../../lib/db/db");
const { deleteEmptyFields } = require("../../../lib/helper/utils");
const { encryptText } = require("../../utils/cryptoKey");
const { getPrivateKeyFingerprint, validatePrivateKey } = require("../../utils/privateKey");

class DestinationService {
    constructor() {}

    prepareConfig(config = {}, type) {
        if (!config || typeof config !== "object") return { config };
        if (type && type !== "ssh") return { config };
        const nextConfig = { ...config };

        if (nextConfig.removePrivateKey) {
            delete nextConfig.privateKey;
            delete nextConfig.privateKeyEnc;
            delete nextConfig.privateKeyFingerprint;
            delete nextConfig.privateKeyUpdatedAt;
            delete nextConfig.passphrase;
            delete nextConfig.removePrivateKey;
            return { config: nextConfig };
        }

        if (nextConfig.privateKey) {
            const normalizedPrivateKey = validatePrivateKey(
                nextConfig.privateKey,
                nextConfig.passphrase
            );
            nextConfig.privateKeyEnc = encryptText(normalizedPrivateKey);
            nextConfig.privateKeyFingerprint = getPrivateKeyFingerprint(
                normalizedPrivateKey,
                nextConfig.passphrase
            );
            nextConfig.privateKeyUpdatedAt = new Date().toISOString();
            delete nextConfig.privateKey;
        }

        delete nextConfig.removePrivateKey;

        return { config: nextConfig };
    }

    buildConfig(data = {}) {
        const config = { ...(data.config || {}) };

        if (data.type === "ssh" && data.removePrivateKey) {
            config.removePrivateKey = true;
        }

        return config;
    }

    async insert(data) {
        try {
            const { name, type, status } = data;
            const config = this.buildConfig(data);
            const prepared = this.prepareConfig(config, type);

          console.log("data: ", data);
          console.log("prepared config: ", config)
            const res = db.prepare(`INSERT INTO destinations (name, type, status, config)
                                    VALUES (?, ?, ?, ?)`)
                        .run(name, type, status ?? null, JSON.stringify(prepared.config));

            return {
                id: res.lastInsertRowid
            };
        } catch (error) {
            console.log("Error insert destination: ", error.message);
            return;
        }
    }

    async update(filters, update = {}) {
        try {
            if (!filters || Object.keys(filters).length === 0)
                return;
            let params = [];
            const updateData = deleteEmptyFields({ ...update });
            delete updateData.removePrivateKey;

            if (updateData.config) {
                const config = this.buildConfig(update);

                // Merge with stored config so fields like privateKeyEnc
                // are preserved when not explicitly changed or removed.
                if (filters.id) {
                    const existing = await this.findById(filters.id);
                    if (existing?.config) {
                        updateData.config = { ...existing.config, ...config };
                    } else {
                        updateData.config = config;
                    }
                }

                const prepared = this.prepareConfig(
                    updateData.config,
                    updateData.type
                );
                updateData.config = JSON.stringify(prepared.config);
            }

            const setUpdate = Object.keys(updateData).map(key => `${key}=?`);
            if (setUpdate.length === 0) {
                return 0;
            }
            console.log("update data: ", updateData)
            const values = Object.values(updateData);
            let query = `UPDATE destinations SET ${setUpdate.join(', ')}`
            if (filters.id) {
                query += " WHERE id = ?";
                params.push(filters.id)
            }
            const res = db.prepare(query).run(...values, ...params);
            return res.changes;
        } catch (error) {
            console.log("Error destination: ", error.message)
            return;
        }
    }

    async find(filters = {}) {
        try {
            let query = `SELECT * FROM destinations WHERE 1=1`;
            let values = [];
            if (filters.id) {
                query += " AND id = ?";
                values.push(filters.id);
            }
            const data = db.prepare(query).all(...values);
            return data.map(dest => ({
                ...dest,
                config: dest.config ? JSON.parse(dest.config) : {}
            }));
        } catch (error) {
            console.log("Error find destinations: ", error.message);
            return;
        }
    }

    async findById(id) {
        try {
            let query = `SELECT * FROM destinations WHERE id=?`;
            const data = db.prepare(query).get(id);
            if (!data) return;
            return {
                ...data,
                config: data.config ? JSON.parse(data.config) : {}
            };
        } catch (error) {
            return;
        }
    }

    async deleteById(id) {
        try {
            const res = db.prepare(`DELETE FROM destinations WHERE id = ?`).run(id);
            return res.changes;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new DestinationService();
