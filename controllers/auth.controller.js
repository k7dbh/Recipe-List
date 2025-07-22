const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');

router.get('/', (req, res) => {
  res.send('does the auth route work?');
});

// SIGN UP VIEW
router.get('/sign-up', (req, res) => {
  res.render('auth/sign-up');
});

// check if user name is taken or not
router.post('/sign-up', async (req, res) => {
  const userInDatabase = await User.findOne({ username: req.body.username });
  if (userInDatabase) {
    return res.send('Username already taken.');
  }
  // password matches confirmPassword
  if (req.body.password !== req.body.confirmPassword) {
    return res.send('Password and confirm password must match.');
  }
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const newUser = await User.create({
    username: req.body.username,
    password: hashedPassword,
    favorites: []
  });
  req.session.user = {
    username: newUser.username,
    _id: newUser._id,
  };
  req.session.save(() => {
    res.redirect('/');
  });
});

router.get('/sign-in', (req, res) => {
  res.render('auth/sign-in');
});

// SIGN IN USER POST 
router.post('/sign-in', async (req, res) => {
  const userInDatabase = await User.findOne({ username: req.body.username });
  if (!userInDatabase) {
    return res.send('Login failed. Please try again.');
  }// check if user exists in the database
  const validPassword = bcrypt.compareSync(req.body.password, userInDatabase.password);
  if (!validPassword) {
    return res.send('Login failed. Please try again.');
  }// chack if user 
  req.session.user = {
    username: userInDatabase.username,
    _id: userInDatabase._id,
  };
  req.session.save(() => {
    res.redirect('/');
  });
});

router.get('/sign-out', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;