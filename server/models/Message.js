import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'ai'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'text'
    },
    isSystem: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);