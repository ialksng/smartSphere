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
        required: true // The extracted text from the document
    },
    summary: { 
        type: String   // We can optionally have the AI generate a quick summary on upload
    },
    source: {
        type: String,
        enum: ['local', 'google_drive', 'onedrive'],
        default: 'local'
    }
}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);