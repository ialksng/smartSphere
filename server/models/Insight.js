const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  filename: {
    type: String,
    required: true
  },

  content: {
    type: String,
    required: true
  },

  summary: {
    type: String
  },

  fileType: {
    type: String
  },

  contentType: {
    type: String,
    enum: ['text', 'pdf', 'image'],
    default: 'text'
  },

  type: {
    type: String,
    enum: ['file', 'folder'],
    default: 'file'
  },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insight',
    default: null
  },

  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insight',
    default: null
  },

  source: {
    type: String,
    enum: ['local', 'google_drive', 'onedrive'],
    default: 'local'
  },

  driveFileId: {
    type: String,
    default: null
  },

  fileUrl: {
    type: String,
    default: null
  },

  isFavorite: {
    type: Boolean,
    default: false
  },

  tags: {
    type: [String],
    default: []
  },

  size: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);