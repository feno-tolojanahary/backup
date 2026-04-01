const { verifyAccessToken } = require("../services/authService");
const response = require("../utils/response");

async function tokenAccess(req, res, next) {
    try {
        const auth = req.headers["authorization"] || "";
        const token = auth.slice(7).trim();
        if (!token) {
            return response.unauthorized(res, "Unauthorized")
        }
        await verifyAccessToken(token);
        next();
    } catch (error) {
        if (error.code === "ERR_JWT_EXPIRED") {
            return response.unauthorized(res, { error: "Token expired.", code: "TOKEN_EXPIRED" })
        }
        console.log("Error access token: ", error.message);
        response.error(res, error.message);
    }
}

module.exports = {
    tokenAccess
}