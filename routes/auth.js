const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/database');
const config = require('../config');

// Register new user
router.post('/register', async (req, res) => {
  const { username, email, password, isAdmin } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ username, email, password, isAdmin });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user.id, isAdmin: user.isAdmin, isPublic: user.isPublic };
    const token = jwt.sign(payload, config.secretOrKey, { expiresIn: config.jwtExpiration });

    res.status(200).json({ token: `Bearer ${token}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GitHub Authentication
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL);
  }
);

// Login success route (with token generation)
router.get('/login/success', (req, res) => {
  if (req.user) {
    // Generate access token
    const accessToken = generateAccessToken(req.user);

    // Respond with access token
    res.status(200).json({
      error: false,
      message: 'Successfully Logged In',
      user: req.user,
      accessToken: accessToken
    });
  } else {
    res.status(403).json({ error: true, message: 'Not Authorized' });
  }
});

router.get('/login/failed', (req, res) => {
  res.status(401).json({ error: true, message: 'Log in failure' });
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect(process.env.CLIENT_URL);
});


function generateAccessToken(user) {
  return jwt.sign(user, config.secretOrKey, { expiresIn: config.jwtExpiration });
}

module.exports = router;
