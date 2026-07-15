/**
 * Centralized response helpers so every mail endpoint replies in the same shape.
 * success shape: { success: true, message, data }
 * error shape:   { success: false, message, error }
 */

function success(res, { data = null, message = 'OK', statusCode = 200 } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function failure(res, { message = 'Something went wrong', statusCode = 500, error = null } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error || message,
  });
}

module.exports = { success, failure };
