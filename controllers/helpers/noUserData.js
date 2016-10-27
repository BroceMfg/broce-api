const noUserData = (res) => {
  return res.status(403).json({
    success: false,
    message: 'error: no user data found'
  });
}

module.exports = noUserData;