const toggles = {
    cloudSync: process.env.ENABLE_CLOUD_SYNC === 'true',
    voiceInput: process.env.ENABLE_VOICE === 'true',
    primaryAI: 'gemini' 
};

const isFeatureEnabled = (featureName) => {
    return toggles[featureName] || false;
};

module.exports = { isFeatureEnabled };