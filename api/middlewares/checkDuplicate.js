const response = require("../utils/response");
const {
    recordExistsByField,
    recordExistsByFieldExceptId,
} = require("../utils/duplicateRecordCheck");

function defaultMessage(field) {
    return `A record with this ${field} already exists.`;
}

function runDuplicateCheck(req, res, next, { mode, table, field, idParam }) {
    const resolvedMessage = defaultMessage(field);
    try {
        const raw = req.body?.[field];
        if (raw === undefined || raw === null) {
            return next();
        }
        const value = String(raw).trim();
        if (!value) {
            return next();
        }

        if (mode === "create") {
            if (recordExistsByField(table, field, value)) {
                return response.badRequest(res, resolvedMessage);
            }
        } else {
            const id = req.params?.[idParam];
            if (id === undefined) {
                return next();
            }
            if (recordExistsByFieldExceptId(table, field, value, id)) {
                return response.badRequest(res, resolvedMessage);
            }
        }

        next();
    } catch (error) {
        console.log("checkDuplicate: ", error.message);
        response.error(res, error.message);
        next(error);
    }
}

function duplicateCheckCreate(table, field) {
    return (req, res, next) =>
        runDuplicateCheck(req, res, next, {
            mode: "create",
            table,
            field,
            idParam: "id",
        });
}

function duplicateCheckUpdate(table, field, options = {}) {
    const idParam = options.idParam ?? "id";
    return (req, res, next) =>
        runDuplicateCheck(req, res, next, {
            mode: "update",
            table,
            field,
            idParam,
        });
}

module.exports = {
    duplicateCheckCreate,
    duplicateCheckUpdate,
};
