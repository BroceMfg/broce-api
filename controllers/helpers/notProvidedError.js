const notProvidedError = (res, field, message) => {
  let msg = 'An unknown error occurred';
  if (process.env.NODE_ENV !== 'production') {
    msg = message ? message : `error: no ${field} provided`;
  }
  return res.status(403).json({
    success: false,
    message: msg
  });
}

module.exports = notProvidedError;