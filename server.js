require('dotenv').config({ quiet: true });
const express = require('express');
const app = express();
const methodOverride = require('method-override');
//const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

//VIEW ENGINE
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const authController = require('./controllers/auth.controller');
const listingController = require("./controllers/listing.controller");
const favoritesRouter = require('./controllers/favorites');

const isSignedIn = require('./middleware/is-signed-in');
const passUserToView = require('./middleware/pass-user-to-view');

const Listing = require('./models/listing');
const User = require('./models/user');

// DATABASE CONNECTION
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
    console.log(`Connected to MongoDB ${mongoose.connection.name} .`);
});

// MIDDLEWARE
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
//app.use(morgan('dev'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
    })
}));
app.use(passUserToView);

// HOMEPAGE SEARCH 

app.get('/', async (req, res) => {
    const search = req.query.search;
    let foundListings;
    if (search) {
        foundListings = await Listing.find({
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        });
    } else {
        foundListings = await Listing.find();
    }
    //FAVORITE LISTS
    let userWithFavorites = null;
    if (req.session.user) {
        userWithFavorites = await User.findById(req.session.user._id).populate('favorites');
    }

    res.render('index.ejs', {
        title: 'my App',
        foundListings,
        search,
        user: userWithFavorites
            ? { ...req.session.user, favorites: userWithFavorites.favorites.map(fav => fav._id.toString()) }
            : req.session.user || null
    });
});


// ROUTES
app.use('/auth', authController);
app.use('/listings', listingController);
app.use('/favorites', favoritesRouter); // <-- add this line

app.get('/vip-lounge', isSignedIn, (req, res) => {
    res.send(`Welcome`);
});

app.use((req, res, next) => {
    res.status(404).send('Page not found');
});

const port = process.env.PORT ? process.env.PORT : "3002";
app.listen(port, () => {
    console.log(`The express app is ready on port ${port}`);
});
