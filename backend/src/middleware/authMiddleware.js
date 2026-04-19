const jwt = require('jsonwebtoken');

const DEMO_USER = { _id: '12345', name: 'Demo User', email: 'demo@dealdish.test' };

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Demo token — pass straight through without DB lookup
  if (authHeader && authHeader.split(' ')[1] === 'demo-token') {
    req.user = DEMO_USER;
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = { _id: decoded.id };
      return next();
    } catch {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect };
