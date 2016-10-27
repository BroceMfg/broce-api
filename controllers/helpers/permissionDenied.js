const permissionDenied = (res) => {
  return res.status(403).json({
    success: false,
    message: 'error: permission denied'
  });
}

module.exports = permissionDenied;