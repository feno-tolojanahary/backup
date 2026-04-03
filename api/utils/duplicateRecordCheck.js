const db = require("../../lib/db/db");

function recordExistsByField(table, field, value) {
    const normalized = String(value ?? "").trim();
    if (!normalized) return false;
    const row = db
        .prepare(
            `SELECT id FROM ${table} WHERE LOWER(TRIM(${field})) = LOWER(?) LIMIT 1`
        )
        .get(normalized);
    return !!row;
}

function recordExistsByFieldExceptId(table, field, value, excludeId) {
    const normalized = String(value ?? "").trim();
    if (!normalized) return false;
    const row = db
        .prepare(
            `SELECT id FROM ${table} WHERE LOWER(TRIM(${field})) = LOWER(?) AND id != ? LIMIT 1`
        )
        .get(normalized, excludeId);
    return !!row;
}

module.exports = {
    recordExistsByField,
    recordExistsByFieldExceptId,
};
