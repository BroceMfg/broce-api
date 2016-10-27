const handleDBFindErrorAndRespondWithAppropriateJSON = (err, res) => {
  console.error(err.stack);
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV !== 'production' 
      ? err.message : 'internal server error'
  });
}

module.exports = handleDBFindErrorAndRespondWithAppropriateJSON;