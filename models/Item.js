const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Lost", "Found"],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    matched: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Item", itemSchema);