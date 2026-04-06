const response = require("../../utils/response");
const notificationProviderService = require("../../services/notifications/notificationProviderService");;

class NotificationProviderController {
    constructor() {}

    async insert (req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const provider = req.body;
            provider.createdBy = req.userId;
            const notification = await notificationProviderService.insert(provider);
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
            const notification = await notificationProviderService.update(id, req.body);
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
}

module.exports = new NotificationProviderController();  