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

    fileType: { 
        type: String 
    },

    content: { 
        type: String, 
        required: true
    },

    summary: { 
        type: String
    },

    // 🔥 SOURCE
    source: {
        type: String,
        enum: ['local', 'google_drive', 'onedrive'],
        default: 'local'
    },

    contentType: {
        type: String,
        enum: ['text', 'pdf', 'image'],
        default: 'text'
    },

    driveFileId: {
        type: String,
        default: null
    },

    fileUrl: {
        type: String,
        default: null
    },

    // =========================
    // 🔥 NEW SaaS FEATURES
    // =========================

    // 📁 Folder support
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },

    // ⭐ Favorites
    isFavorite: {
        type: Boolean,
        default: false
    },

    // 🧠 AI Tags
    tags: {
        type: [String],
        default: []
    },

    // 📊 File size (for analytics)
    size: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);