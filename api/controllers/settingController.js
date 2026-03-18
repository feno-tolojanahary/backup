const settingService = require("../services/settingService")
const response = require("./../utils/response")

class SettingController {
    constructor() {}

    async insert(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const result = await settingService.insert(req.body);
            response.created(res, result)
            next();
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            if (!req.body)
                throw new Error("Req body is required.")
            const result = await settingService.update(req.body.key, req.body);
            response.success(res, result);
            next();
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async multiUpsert(req, res, next) {
        try {
            if (!req.body || !Array.isArray(req.body))
                throw new Error("Req body is required and must be an array.")
            let results = [];
            for (const setting of req.body) {
                let result;
                const foundSetting = await settingService.findByKey(setting.key);
                if (!foundSetting) {
                    result = await settingService.insert(setting)
                } else {
                    result = await settingService.update(setting.key, req.value)
                }
                results.push(result);
            }
            response.success(res, result);
            next();
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async findAll(req, res, next) {
        try {
            const result = await settingService.findAll();
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new SettingController();