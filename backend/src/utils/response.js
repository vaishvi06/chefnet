/**
 * Standard API response helper ensuring consistent JSON structure
 * { success: true, message, data }
 */
const sendResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const payload = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendResponse
};
