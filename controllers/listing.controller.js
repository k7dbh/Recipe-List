const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const isSignedIn = require('../middleware/is-signed-in');
const upload = require('../config/multer');
const User = require('../models/user');
const cloudinary = require('../config/cloudinary');


// VIEW NEW LISTING FORM
router.get("/new", isSignedIn, (req, res) => {
  res.render('listings/new');
});

// POST FORM DATA TO DATABASE
router.post('/', isSignedIn, upload.single('image'), async (req, res) => {
  try {
    req.body.poster = req.session.user._id;
    req.body.image = {
      url: req.file.path,
      cloudinary_id: req.file.filename
    };
    console.log(req.file.path)
    await Listing.create(req.body);
    res.redirect('/listings');
  } catch (error) {
    console.log(error);
    res.send('Something went wrong');
  }
});

// VIEW INDEX PAGE
router.get('/', async (req, res) => {
  const foundListings = await Listing.find();
  res.render('listings/index', { foundListings });
});

// VIEW SINGLE LISTING IN SHOW PAGE
router.get('/:listingId', async (req, res) => {
  try {
    const foundListing = await Listing.findById(req.params.listingId)
      .populate('poster')
      .populate('comments.author');
    console.log(foundListing)
    res.render('listings/show', { foundListing });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// DELETE LISTING FROM DATABASE
router.delete('/:listingId', isSignedIn, async (req, res) => {
  // find the listing
  const foundListing = await Listing.findById(req.params.listingId).populate('poster');
  // check is the user have listings
  if (foundListing.poster._id.equals(req.session.user._id)) {
    if(foundListing.image?.cloudinary_id){
      await cloudinary.uploader.destroy(foundListing.image.cloudinary_id)
    }
    //delete listing and redirect
    await foundListing.deleteOne();
    return res.redirect('/listings');
  }
  return res.send('Not authorized');
});

// Render Edit from View
router.get('/:listingId/edit', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('poster');
  if (foundListing.poster._id.equals(req.session.user._id)) {
    return res.render('listings/edit', { foundListing });
  }
  return res.send('Not authorized');
});

router.put('/:listingId', isSignedIn, upload.single('image'), async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId).populate('poster');

  if (foundListing.poster._id.equals(req.session.user._id)) {
    if (req.file) {
      req.body.image = {
        url: req.file.path,
        cloudinary_id: req.file.filename
      };
    };
    if(req.file && foundListing.image?.cloudinary_id){
      await cloudinary.uploader.destroy(foundListing.image.cloudinary_id)
      foundListing.image.url = req.file.path;
      foundListing.image.cloudinary_id = req.file.filename;
    }
    foundListing.title = req.body.title;
    foundListing.description = req.body.description;
    
    await foundListing.save()
    return res.redirect(`/listings/${req.params.listingId}`);
  }
  return res.send('Not authorized');
});

// post comments to database
router.post('/:listingId/comments', isSignedIn, async (req, res) => {
  const foundListing = await Listing.findById(req.params.listingId);
  req.body.author = req.session.user._id;
  foundListing.comments.push(req.body);
  await foundListing.save();
  res.redirect(`/listings/${req.params.listingId}`);
});

module.exports = router;