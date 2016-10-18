const notProvidedFieldErrorResponse = (res, field, message) => {
  return res.status(403).json({
    success: false,
    message: message ? message : `error: no ${field} provided`
  });
}

module.exports = notProvidedFieldErrorResponse;