const internalServerError = (res) => {
  return res.status(500).json({
    success: false,
    message: 'error: internal server error'
  });
}

module.exports = internalServerError;