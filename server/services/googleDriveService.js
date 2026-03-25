const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const getGoogleAuthUrl = () => {
    const scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline', 
        prompt: 'consent',      
        scope: scopes,
    });
};

const getGoogleTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

module.exports = {
    getGoogleAuthUrl,
    getGoogleTokens,
    oauth2Client
};