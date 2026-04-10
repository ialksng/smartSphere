const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  userId: String,
  name: String,

  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);