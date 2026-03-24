const crypto = require("crypto");
const response = require("../utils/response");
const { stmts, buildAccessToken, EXPIRATION_TIME_MS } = require("../services/authService");
const argon2 = require("argon2");

class AuthController {
    constructor() {}

    async login(req, res, next) {
        try {
            if (!req.body)
                throw new Error("req.body is required.");
            const { email, password } = req.body;
            const user = stmts.findByEmail.get(email);
            if (!user || !await argon2.verify(user.password, password)) {
                response.badRequest(res, "Invalid email or password.")
                return;
            }
            const roles = stmts.findPermissions.all(user.id);
            const permissions = stmts.findRoles.all(user.id);

            const accessToken = await buildAccessToken(user, permissions, roles);
            const refreshToken = crypto.randomBytes(64).toString();
            const expirationTime = (Date.now() + EXPIRATION_TIME_MS) / 1000;
            stmts.setRefreshToken.run(refreshToken, expirationTime, user.id);

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: EXPIRATION_TIME_MS,
                path: "/auth/refresh"
            })

            response.success(res, {
                accessToken,
                auth: {
                    user,
                    roles,
                    permissions
                }
            })
        } catch(error) {
            console.log("Error login: ", error.message);
            response.error(res, error.message);
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            if (!req.body) {
                throw new Error("Body is required.")
            }
            const user = stmts.findByRefreshToken.get(req.body);
            if (!user) {
                response.badRequest(res, "Invalid refresh token.");
                return;
            }
            if (user.expires_at < (Date.now()/1000)) {
                response.badRequest(res, "Refresh token expired.");
                return;
            }
            const roles = stmts.findPermissions.all(user.id);
            const permissions = stmts.findRoles.all(user.id);

            const accessToken = buildAccessToken(user, permission, roles);
            const refreshToken = crypto.randomBytes(64).toString();
            stmts.setRefreshToken.run(refreshToken, (Date.now() + EXPIRATION_TIME_MS) / 1000, user.id);

            res.cookie("refresh_token", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: EXPIRATION_TIME_MS,
                path: "/auth/refresh"
            })

            response.success(res, {
                accessToken,
                refreshToken
            })
        } catch(error) {    
            console.log("Error refresh tok  en: ", error.message);
            res.clearCookie("refresh_token", { path: "/auth/refresh" });
            response.error(res, error.message);
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            if (!req.params.id)
                throw new Error("The user id is required.");
            const user = stmts.findById.get(req.params.id);
            if (!user) 
                throw new Error("User not found.");
            stmts.clearRefreshToken.run(user.id);
            res.clearCookie("refreshToken", { path: "/auth/refresh" });
            response.success(res, { ok: true });
        } catch (error) {
            console.log("Error logout: ", error.message);
            response.error(res, error.message);
            next(error);
        }
    }


    
}

module.exports = new AuthController();