const User = require('../models/user');

const passUserToView = async (req, res, next) => {
  if (req.session.user) {
    const user = await User.findById(req.session.user._id).populate('favorites');
    res.locals.user = {
      ...req.session.user,
      favorites: user.favorites ? user.favorites.map(f => f._id.toString()) : []
    };
  } else {
    res.locals.user = null;
  }
  next();
};

module.exports = passUserToView;