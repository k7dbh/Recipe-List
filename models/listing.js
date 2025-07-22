const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new mongoose.Schema({
  content: String,
  author: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const listingSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: {
    url: { type: String, required: true },
    cloudinary_id: { type: String, required: true }
  },
  poster: { type: Schema.Types.ObjectId, ref: 'User' },
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);