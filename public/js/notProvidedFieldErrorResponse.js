const notProvidedFieldErrorResponse = (res, field) => {
  return res.status(403).json({
    success: false,
    message: `error: no ${field} provided`
  });
}

module.exports = notProvidedFieldErrorResponse;