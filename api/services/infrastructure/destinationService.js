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

    async insert(data) {
        try {
            const {
                name,
                type,
                config,
                created_by,
                createdBy
            } = data;

            const prepared = this.prepareConfig(config, type);
            const res = db.prepare(`INSERT INTO destinations (name, type, config, created_by)
                                    VALUES (?, ?, ?, ?)`)
                        .run(name, type, JSON.stringify(prepared.config), created_by ?? createdBy);

            return {
                id: res.lastInsertRowid
            };
        } catch (error) {
            return;
        }
    }

    async update(filters, update = {}) {
        try {
            if (!filters || Object.keys(filters).length === 0)
                return;
            let params = [];
            const updateData = deleteEmptyFields(update);
            if (updateData.config) {
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
