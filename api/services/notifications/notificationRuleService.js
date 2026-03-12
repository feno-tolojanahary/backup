const db = require("../../../lib/db/db");

class NotificationRuleService {
    constructor() {}

    
    async getRules(filters) {
        try {
            let params = [];
            let query = `
                SELECT 
                    rule.id AS id,
                    rule.name AS name,
                    rule.event_type AS eventType,
                    rule.is_enable AS isEnable,
                    rule.created_at AS createdAt, 
                    json_object(
                        'id', provider.id,
                        'name', provider.name,
                        'type', provider.type,
                        'config', provider.confg,
                        'isEnable', provider.isEnable
                    ) AS provider
                FROM notification_rules rule
                LEFT JOIN notification_providers provider ON provider.id = rule.provider_id
                WHERE 1=1
            `;
            if (filters.providerId) {
                query += " AND provider_id = ?";
                params.push(filters.providerId);
            }
            const rules = db.prepare(query).all(...params);
            return rules.map((rule) => ({
                ...rule,
                provider: {
                    ...rule.provider,
                    isEnable: Boolean(rule.provider.isEnable)
                },
                isEnable: Boolean(rule.isEnable)
            }))
        } catch (error) {
            console.log("Error when getting rules: ", error.message);
            return;
        }
    }

    async saveRules(rules) {
        try {
            const insertedIds = [];
            const query = `INSERT INTO notification_rules (name, event_type, provider_id, is_enable) VALUES (?, ?, ?, ?)`;
            const insertStmt = db.prepare(query);
            for (const rule of rules) {
                const ruleData = [
                    rule.name,
                    rule.eventType,
                    rule.providerId,
                    rule.isEnable ? 1 : 0
                ]
                const res = insertStmt.insert(...ruleData);
                results.push(res.lastInsertRowid);
            }  
            return insertedIds
        } catch (error) {
            return {
                ok: false,
                errorMsg: error.message
            }
        }
    }

    async updateRule(id, rule) {
        try {
            const setUpdate = [];
            const values = [];
            const mapField = {
                eventType: "event_type",
                providerId: "provider_id",
                isEnable: "is_enable"
            }
            for (const [key, value] of Object.entries(rule)) {
                const fieldName = mapField[key] ? mapField[key] : key;
                setUpdate.push(`SET ${fieldName} = ?`);
                values.push(value);
            }
            let query = `UPDATE notification_rules SET ${setUpdate.join(', ')} WHERE id = ?`;
            const stmt = db.prepare(query);
            const res = stmt.run(...values, id)
            return {
                ok: true,
                id: res.lastInsertRowid
            }
        } catch (error) {
            return {
                ok: false,
                errorMsg: error.message
            }
        }
    }

    async deleteRule(id) {
        try {
            const stmt = db.prepare(`DELETE FROM notification_rules WHERE id = ?`);
            const res = stmt.run(id);
            if (res.changes === 0) {
                throw new Error("Id of rule not found")
            }
            return {
                ok: true,
                changes: res.changes
            }
        } catch (error) {
            return {
                ok: false,
                errorMsg: error.message
            }
        }
    }
}

module.exports = new NotificationRuleService();