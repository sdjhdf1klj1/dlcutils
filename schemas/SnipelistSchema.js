const mongoose = require('mongoose');

const snipelistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // Ensures each name is unique
    }
});

const Snipelist = mongoose.model('Snipelist', snipelistSchema);

module.exports = Snipelist;