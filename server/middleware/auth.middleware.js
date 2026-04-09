const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        // Get token from the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Access Denied. No token provided." });
        }

        const token = authHeader.split(' ')[1];

        // Verify token (Make sure process.env.JWT_SECRET matches what you used in auth.controller.js)
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        
        // Attach user info to the request object
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token." });
    }
};

module.exports = { verifyToken };