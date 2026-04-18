const AppError = require("../../lib/helper/error");

const response = {

  success(res, data = null, message = "Success", status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  },

  created(res, data = null, message = "Resource created") {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  },

  noContent(res) {
    return res.status(204).send();
  },

  badRequest(res, message = "Bad request") {
    return res.status(400).json({
      success: false,
      message
    });
  },

  unauthorized(res, message = "Unauthorized") {
    return res.status(401).json({
      success: false,
      message
    });
  },

  forbidden(res, message = "Forbidden") {
    return res.status(403).json({
      success: false,
      message
    });
  },

  notFound(res, message = "Resource not found") {
    return res.status(404).json({
      success: false,
      message
    });
  },

  error(res, message = "Internal server error", status = 500) {
    let payload = {};
    if (message instanceof AppError) {
      payload = {
        success: false,
        message: message.message,
        showUser: true
      }
    } else if (message instanceof Error) {
      payload = {
        success: false,
        message: message.message
      }
    } else {
      payload = {
        success: false,
        message
      }
    }
    return res.status(status).json(payload);
  }

};

module.exports = response;