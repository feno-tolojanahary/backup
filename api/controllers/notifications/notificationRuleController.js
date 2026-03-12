const response = require("../utils/response");
const notificationRuleService = require("../../services/notifications/notificationRuleService");

class NotificationRuleController {
    constructor() {}

    async getRules(req, res, next) {
        try {
            const filters = req.query;
            const rules = await notificationRuleService.getRules(filters);
            response.success(res, rules);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async saveRules(req, res, next) {
        try {
            const data = req.body;
            if (!Array.isArray(data))
                throw new Error("The body must be an array");
            const result = await notificationRuleService.saveRules(data);
            if (result.ok === false)
                throw new Error(result.errorMsg);
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async updateRules(req, res, next) {
        try {
            const data = req.body;
            const updatedIds = [];
            if (!data)
                throw new Error("The body is required.");
            for (const ruleUpdate of data) {
                const { id, update } = ruleUpdate;
                const result = await notificationRuleService.updateRule(id, update);
                updatedIds.push(result.id);
            }
            response.success(res, updatedIds);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async deleteRule(req, res, next) {
        try {
            const id = req.params.id;
            if (!id) {
                throw new Error("The id params is required");
            }
            const result = await notificationRuleService.deleteRule(id);
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new NotificationRuleController();