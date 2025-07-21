const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Listing = require('../models/listing');
const isSignedIn = require('../middleware/is-signed-in');

router.post('/:listingId/add', isSignedIn, async (req, res) => {
  await User.findByIdAndUpdate(req.session.user._id, {
    $addToSet: { favorites: req.params.listingId }
  });
  res.redirect(req.get('referer') || '/');
});

router.post('/:listingId/remove', isSignedIn, async (req, res) => {
  await User.findByIdAndUpdate(req.session.user._id, {
    $pull: { favorites: req.params.listingId }
  });
  res.redirect(req.get('referer') || '/');
});

router.get('/', isSignedIn, async (req, res) => {
  const user = await User.findById(req.session.user._id).populate('favorites');
  res.render('favorites', { favorites: user.favorites });
});

module.exports = router;