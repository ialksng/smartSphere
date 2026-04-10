const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  name: String,
  content: String,

  source: {
    type: String,
    enum: ["google", "onedrive", "local"],
    default: "local"
  },

  size: Number,

  folderId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Folder",
  default: null
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Document", documentSchema);