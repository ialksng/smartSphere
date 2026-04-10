const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  filename: {
    type: String,
    required: true,
    trim: true
  },

  content: {
    type: String,
    default: ""
  },

  summary: {
    type: String,
    default: ""
  },

  fileType: {
    type: String,
    default: "text"
  },

  mimeType: {
    type: String,
    default: "text/plain"
  },

  contentType: {
    type: String,
    enum: ['text', 'pdf', 'image'],
    default: 'text'
  },

  type: {
    type: String,
    enum: ['file', 'folder'],
    default: 'file',
    index: true
  },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insight',
    default: null,
    index: true
  },

  source: {
    type: String,
    enum: ['local', 'google_drive', 'onedrive'],
    default: 'local',
    index: true
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
    default: false,
    index: true
  },

  isTrashed: {
    type: Boolean,
    default: false,
    index: true
  },

  tags: {
    type: [String],
    default: []
  },

  size: {
    type: Number,
    default: 0
  },

  lastOpened: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);