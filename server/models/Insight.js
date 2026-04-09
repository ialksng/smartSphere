const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sourceFileName: { type: String, required: true },
    summary: { type: String, required: true },
    keyPoints: [{ type: String }],
    topics: [{ type: String }],
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative', 'Mixed'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Insight', insightSchema);