const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const isSignedIn = require('../middleware/is-signed-in');
const upload = require('../config/multer');
const User = require('../models/user');

router.get("/new", isSignedIn, (req, res) => {
  res.render('listings/new');
});

router.post('/', isSignedIn, upload.single('image'), async (req, res) => {
  try {
    req.body.viewer = req.session.user._id;
    req.body.image = {
      url: req.file.path,
      cloudinary_id: req.file.filename 
    };
    await Listing.create(req.body);
    res.redirect('/listings');
  } catch (error) {
    console.log(error);
    res.send('Something went wrong');
  }
});

router.get('/', async (req, res) => {
  const foundListings = await Listing.find();
  res.render('listings/index', { foundListings });
});

router.get('/:listingId', async (req, res) => {
  try {
    const foundListing = await Listing.findById(req.params.listingId)
      .populate('viewer')
      .populate('comments.author');
      console.log(foundListing)
    res.render('listings/show', { foundListing });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.delete('/:listingId', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('viewer');
  if (foundListing.viewer._id.equals(req.session.user._id)) {
    await foundListing.deleteOne();
    return res.redirect('/listings');
  }
  return res.send('Not authorized');
});

router.get('/:listingId/edit', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('viewer');
  if (foundListing.viewer._id.equals(req.session.user._id)) {
    return res.render('listings/edit', { foundListing });
  }
  return res.send('Not authorized');
});

router.put('/:listingId', isSignedIn, upload.single('image'), async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('viewer');
  if (foundListing.viewer._id.equals(req.session.user._id)) {
    if (req.file) {
      req.body.image = {
        url: req.file.path,
        cloudinary_id: req.file.filename
      };
    }
    await Listing.findByIdAndUpdate(req.params.listingId, req.body, { new: true });
    return res.redirect(`/listings/${req.params.listingId}`);
  }
  return res.send('Not authorized');
});

router.post('/:listingId/comments', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId);
  req.body.author = req.session.user._id;
  foundListing.comments.push(req.body);
  await foundListing.save();
  res.redirect(`/listings/${req.params.listingId}`);
});

module.exports = router;