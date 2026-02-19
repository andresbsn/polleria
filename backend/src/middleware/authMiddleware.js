const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    // Bearer <token>
    const bearer = token.split(' ');
    const tokenVal = bearer.length === 2 ? bearer[1] : token;

    jwt.verify(tokenVal, process.env.JWT_SECRET || 'secret_key_123', (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

const protect = verifyToken;

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ error: 'Require Admin Role' });
    }
};

const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ error: 'Require SuperAdmin Role' });
    }
};

module.exports = { verifyToken, protect, isAdmin, isSuperAdmin };
