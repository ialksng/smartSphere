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
    }

}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);