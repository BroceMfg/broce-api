const internalServerError = (res, message) => {
  return res.status(500).json({
    success: false,
    message: message || 'error: internal server error'
  });
}

module.exports = internalServerError;