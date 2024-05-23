const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin, ensurePublicOrOwnProfile } = require('../middleware/auth');
const User = require('../models/database'); 

// Route to get all users (admin only)
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get a single user profile (public or own)
router.get('/:id', ensurePublicOrOwnProfile, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new user (requires authentication)
router.post('/', ensureAuthenticated, async (req, res) => {
  const { username, email, password, photo, name, bio, phone, isPublic } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ username, email, password, photo, name, bio, phone, isPublic });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (public or own)
router.put('/:id', ensurePublicOrOwnProfile, async (req, res) => {
  const { username, email, password, photo, name, bio, phone, isPublic } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.username = username || user.username;
    user.email = email || user.email;
    user.password = password || user.password;
    user.photo = photo || user.photo;
    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.phone = phone || user.phone;
    user.isPublic = isPublic !== undefined ? isPublic : user.isPublic;

    await user.save();
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user profile (public or own)
router.delete('/:id', ensurePublicOrOwnProfile, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.remove();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
