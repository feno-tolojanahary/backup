const response = require("../utils/response");
const notificationProviderService = require("./../services/notificationProviderService");

class NotificationProviderController {
    constructor() {}

    async insert (req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const notification = await notificationProviderService.insert(req.body);
            response.created(res, notification);
            next();
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async update (req, res, next) {
        try {
            const id = req.params.id;
            if (!req.body)
                throw new Error("Req body is required.")
            if (!id) 
                throw new Error("The id in params is required");
            const notification = await notificationProviderService.update({ id }, req.body);
            response.success(res, notification);
            next();
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async deleteById (req, res, next) {
        try {
            const id = req.params.id;
            if (!id)
                throw new Error("The param id is required");
            await notificationProviderService.deleteById(id);
            response.noContent(res);
            next();
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async getAll (req, res, next) {
        try {
            const result = await notificationProviderService.find();
            response.success(res, result);
            next();
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async getById (req, res, next) {
        try {
            const id = req.params.id;
            if (!id)
                throw new Error("The param id is required.");
            const result = await notificationProviderService.findById(id);
            response.success(res, result);
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
            const result = await notificationProviderService.saveRules(data);
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
                const result = await notificationProviderService.updateRule(id, update);
                updatedIds.push(result.id);
            }
            response.success(res, updatedIds);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new NotificationProviderController();