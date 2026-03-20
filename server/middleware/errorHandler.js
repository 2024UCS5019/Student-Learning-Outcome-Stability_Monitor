const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Invalid request id" });
  }
  res.status(500).json({ message: err.message || "Server Error" });
};

module.exports = errorHandler;
