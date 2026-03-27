const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Invalid request id" });
  }
  const status = Number(err?.statusCode || err?.status) || 500;
  res.status(status).json({ message: err.message || "Server Error" });
};

module.exports = errorHandler;
