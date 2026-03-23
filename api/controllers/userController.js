const argon2 = require("argon2");
const userService = require("../services/userService");
const response = require("../utils/response");

class UserController {
    constructor() {}

    async insert(req, res, next) {
        try {
            if (!req.body) {
                throw new Error("req.body is required.")
            }
            let user = req.body;
            const hashPassword = argon2.hash(user.password, {
                type: argon2.argon2d,
                memoryCost: 2 ** 16,
                timeCost: 3,
                parallelism: 1
            });
            user.password = hashPassword;
            const res = await userService.insert(user);
            response.success(res, res);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new UserController();