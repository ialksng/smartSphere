const mongoose = require('mongoose');
const { encryptToken, decryptToken } = require('../utils/crypto');

// Sub-schema for cloud provider tokens
const cloudTokenSchema = new mongoose.Schema({
    accessToken: { type: String, required: true },
    refreshToken: { type: String }, 
    expiryDate: { type: Number },
    accountId: { type: String },    
    email: { type: String }         
}, { _id: false });

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: true 
    },

    cloudAccounts: {
        googleDrive: cloudTokenSchema,
        dropbox: cloudTokenSchema,
        oneDrive: cloudTokenSchema
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);