const mongoose = require("mongoose");

const validateObjectId = (req, res, next) => {
  const id = req.params.id;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }
  next();
};

module.exports = validateObjectId;
