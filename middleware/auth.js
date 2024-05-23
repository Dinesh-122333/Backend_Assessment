const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/database'); 

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  const tokenParts = token.split(' ');
  if (tokenParts[0] !== 'Bearer' || tokenParts.length !== 2) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  jwt.verify(tokenParts[1], config.secretOrKey, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Failed to authenticate token' });

    req.user = decoded;
    next();
  });
};

const ensureAuthenticated = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  });
};

const ensureAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && req.user.isAdmin) {
      return next();
    }
    res.status(403).json({ message: 'Forbidden: Admins only' });
  });
};

const ensurePublicOrOwnProfile = (req, res, next) => {
  verifyToken(req, res, async () => {
    if (req.user) {
      const isOwner = req.user.id === req.params.id;
      if (req.user.isAdmin || isOwner) {
        return next();
      }
    }

    try {
      const user = await User.findById(req.params.id);
      if (!user || !user.isPublic) {
        return res.status(403).json({ message: 'Forbidden: Profile is private' });
      }
      next();
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });
};

module.exports = { ensureAuthenticated, ensureAdmin, ensurePublicOrOwnProfile };
